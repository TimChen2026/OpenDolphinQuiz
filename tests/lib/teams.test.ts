/*
 * Copyright (C) 2026 DolphinQuiz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * This file is part of the DolphinQuiz project.
 *
 * DolphinQuiz is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * DolphinQuiz is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// 团队(Team)核心逻辑单元测试
//
// 覆盖:
// - joinTeamByName:加入已有团队(member)/创建新团队(admin)
// - joinTeamAsCustomer:客户归属团队(customer 角色)
// - markUserAsCustomer:仅将 member 账号标记为客户
// - resolveUserTeamId:客户返回 null/已有团队直接返回/存量用户惰性迁移(超管归入 Testing)
// - getTeamStaffUserIds:仅返回 admin/member(不含客户)

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));

// 查询链 mock:支持 select().from().where().limit()/orderBy() 链式调用与 await
type Row = Record<string, unknown>;

function makeSelectMock(resultQueues: Row[][]) {
  let callIndex = 0;
  return vi.fn(() => {
    const queue = resultQueues[Math.min(callIndex++, resultQueues.length - 1)];
    const chain: Record<string, unknown> = {};
    const self = {
      from: vi.fn(() => chain),
      where: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      orderBy: vi.fn(() => chain),
      then: (resolve: (rows: Row[]) => unknown) =>
        Promise.resolve(queue).then(resolve),
    };
    Object.assign(chain, self);
    return chain;
  });
}

// insert 链 mock:insert(table).values(...)[.onConflictDoNothing()]
const insertValuesMock = vi.fn();
const insertConflictMock = vi.fn();
function makeInsertMock(shouldFail = false) {
  return vi.fn(() => {
    const chain = {
      values: insertValuesMock.mockImplementation(() =>
        shouldFail
          ? Promise.reject(new Error("unique violation"))
          : { onConflictDoNothing: insertConflictMock.mockResolvedValue(undefined) }
      ),
    };
    return chain;
  });
}

const updateWhereMock = vi.fn();

import {
  joinTeamByName,
  joinTeamAsCustomer,
  markUserAsCustomer,
  resolveUserTeamId,
  getTeamMemberUserIds,
  SUPER_ADMIN_TEAM_NAME,
} from "@/lib/teams";

describe("joinTeamByName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("团队已存在时以 member 角色加入", async () => {
    const existingTeam = { id: "team-1", name: "Acme", createdAt: new Date() };
    const { db } = await import("@/lib/db");
    vi.mocked(db).select = makeSelectMock([[existingTeam]]) as never;
    vi.mocked(db).insert = makeInsertMock() as never;

    const result = await joinTeamByName("user-2", "Acme");

    expect(result).toEqual(existingTeam);
    // 成员记录插入到已有团队,角色为 member
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: "team-1",
        userId: "user-2",
        role: "member",
      })
    );
  });

  it("团队不存在时创建新团队且首个用户为 admin", async () => {
    const { db } = await import("@/lib/db");
    // 第一次 select:findTeamByName 无结果;第二次 select:并发兜底重查(不应触发)
    vi.mocked(db).select = makeSelectMock([[]]) as never;
    vi.mocked(db).insert = makeInsertMock() as never;

    const result = await joinTeamByName("user-1", "NewTeam");

    expect(result).toMatchObject({ id: "user-1", name: "NewTeam" });
    // 团队 id 复用创建者 userId,成员角色为 admin
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: "user-1",
        userId: "user-1",
        role: "admin",
      })
    );
  });

  it("团队名为空时抛出错误", async () => {
    await expect(joinTeamByName("user-1", "   ")).rejects.toThrow(
      "团队/公司名称不能为空"
    );
  });
});

describe("joinTeamAsCustomer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("以 customer 角色插入成员记录", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db).insert = makeInsertMock() as never;

    await joinTeamAsCustomer("customer-1", "team-1");

    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: "team-1",
        userId: "customer-1",
        role: "customer",
      })
    );
  });
});

describe("markUserAsCustomer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("仅更新 accountType 为 member 的用户", async () => {
    const { db } = await import("@/lib/db");
    const setMock = vi.fn().mockReturnValue({ where: updateWhereMock });
    vi.mocked(db).update = vi.fn().mockReturnValue({ set: setMock }) as never;

    await markUserAsCustomer("user-1");

    expect(setMock).toHaveBeenCalledWith({ accountType: "customer" });
  });
});

describe("resolveUserTeamId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SUPER_ADMIN_EMAIL;
  });

  it("客户账号返回 null(可属多个团队,无单一团队上下文)", async () => {
    const result = await resolveUserTeamId({
      id: "customer-1",
      name: "C",
      email: "c@example.com",
      accountType: "customer",
    });
    expect(result).toBeNull();
  });

  it("已有团队成员记录时直接返回所属团队 ID", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db).select = makeSelectMock([[{ teamId: "team-9" }]]) as never;

    const result = await resolveUserTeamId({
      id: "user-2",
      name: "Alice",
      email: "alice@example.com",
      accountType: "member",
    });

    expect(result).toBe("team-9");
  });

  it("存量用户惰性迁移:超级管理员归入 Testing 团队", async () => {
    process.env.SUPER_ADMIN_EMAIL = "tim@example.com";
    const { db } = await import("@/lib/db");
    // 第一次 select:成员记录为空;第二次 select:findTeamByName(Testing) 为空
    vi.mocked(db).select = makeSelectMock([[], []]) as never;
    vi.mocked(db).insert = makeInsertMock() as never;

    const result = await resolveUserTeamId({
      id: "tim-user-id",
      name: "Tim",
      email: "tim@example.com",
      accountType: "member",
    });

    expect(result).toBe("tim-user-id");
    // 创建的团队名为 Testing(超管专属团队)
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "tim-user-id", name: SUPER_ADMIN_TEAM_NAME })
    );
  });

  it("存量普通用户惰性迁移:创建以用户名命名的团队并成为 admin", async () => {
    const { db } = await import("@/lib/db");
    // 成员记录为空;findTeamByName(用户名) 为空
    vi.mocked(db).select = makeSelectMock([[], []]) as never;
    vi.mocked(db).insert = makeInsertMock() as never;

    const result = await resolveUserTeamId({
      id: "legacy-user",
      name: "LegacyName",
      email: "legacy@example.com",
      accountType: "member",
    });

    expect(result).toBe("legacy-user");
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "legacy-user", name: "LegacyName" })
    );
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: "legacy-user",
        userId: "legacy-user",
        role: "admin",
      })
    );
  });

  it("存量用户重名团队冲突时追加后缀重试", async () => {
    const { db } = await import("@/lib/db");
    // 成员记录为空;findTeamByName("Alice") 已存在同名团队
    vi.mocked(db).select = makeSelectMock([
      [],
      [{ id: "other-team", name: "Alice", createdAt: new Date() }],
    ]) as never;
    vi.mocked(db).insert = makeInsertMock() as never;

    const result = await resolveUserTeamId({
      id: "user-77",
      name: "Alice",
      email: "alice77@example.com",
      accountType: "member",
    });

    expect(result).toBe("user-77");
    // 团队名追加了 userId 前缀避免重名
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: expect.stringMatching(/^Alice-/) })
    );
  });
});

describe("getTeamMemberUserIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("返回团队全部成员的用户 ID(含客户,用于数据范围过滤)", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db).select = makeSelectMock([
      [
        { userId: "admin-1" },
        { userId: "member-1" },
        { userId: "customer-1" },
      ],
    ]) as never;

    const ids = await getTeamMemberUserIds("team-1");
    expect(ids).toEqual(["admin-1", "member-1", "customer-1"]);
  });
});
