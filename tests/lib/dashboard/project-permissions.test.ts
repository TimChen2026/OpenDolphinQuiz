/*
 * Copyright (C) 2026 DolphinQuiz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// 项目查看授权与可见性过滤单元测试
//
// 覆盖:
// - 角色判定:管理员/销售总监/超级管理员可看全部,销售经理/普通成员受限
// - 可见性过滤:受限用户返回自己跟踪 + 被授权的项目

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));

import {
  isTeamAdminViewer,
  canViewAllProjects,
  getVisibleProjectsByTenant,
  type ProjectViewer,
} from "@/lib/dashboard/project-permissions";
import { db } from "@/lib/db";

const SUPER_ADMIN_EMAIL = "super@example.com";

function makeViewer(overrides: Partial<ProjectViewer>): ProjectViewer {
  return {
    id: "user-1",
    role: "user",
    isDirector: false,
    email: "user-1@example.com",
    ...overrides,
  };
}

// 查询链 mock:select().from().where()/orderBy() 最终 await 返回按调用顺序出队的 rows
function makeSelectMock(rowsQueue: unknown[][]) {
  const queue = rowsQueue.map((rows) => [...rows]);
  return vi.fn(() => {
    const rows = queue.shift() ?? [];
    const chain: {
      then: (resolve: (rows: unknown) => unknown) => Promise<unknown>;
      from: ReturnType<typeof vi.fn>;
      where: ReturnType<typeof vi.fn>;
      orderBy: ReturnType<typeof vi.fn>;
    } = {
      then: (resolve) => Promise.resolve(rows).then(resolve),
      from: vi.fn(() => chain),
      where: vi.fn(() => chain),
      orderBy: vi.fn(() => chain),
    };
    return chain;
  });
}

describe("角色判定(项目看板可见范围)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPER_ADMIN_EMAIL = SUPER_ADMIN_EMAIL;
  });

  afterEach(() => {
    delete process.env.SUPER_ADMIN_EMAIL;
  });

  it("团队管理员(团队创建者)可查看全部项目", () => {
    const viewer = makeViewer({ id: "team-1", role: "admin" });
    expect(isTeamAdminViewer("team-1", viewer)).toBe(true);
    expect(canViewAllProjects("team-1", viewer)).toBe(true);
  });

  it("销售总监(is_director 标记)可查看全部项目", () => {
    const viewer = makeViewer({ isDirector: true, role: "sales_manager" });
    expect(canViewAllProjects("team-1", viewer)).toBe(true);
  });

  it("销售总监(role = sales_director 旧数据)可查看全部项目", () => {
    const viewer = makeViewer({ role: "sales_director" });
    expect(canViewAllProjects("team-1", viewer)).toBe(true);
  });

  it("超级管理员(SUPER_ADMIN_EMAIL)可查看全部项目", () => {
    const viewer = makeViewer({ email: SUPER_ADMIN_EMAIL });
    expect(canViewAllProjects("team-1", viewer)).toBe(true);
  });

  it("销售经理默认受限:不可查看全部项目", () => {
    const viewer = makeViewer({ role: "sales_manager" });
    expect(canViewAllProjects("team-1", viewer)).toBe(false);
  });

  it("普通成员默认受限:不可查看全部项目", () => {
    const viewer = makeViewer({ role: "user" });
    expect(canViewAllProjects("team-1", viewer)).toBe(false);
  });
});

describe("getVisibleProjectsByTenant(按角色过滤项目列表)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPER_ADMIN_EMAIL = SUPER_ADMIN_EMAIL;
  });

  afterEach(() => {
    delete process.env.SUPER_ADMIN_EMAIL;
  });

  it("管理员直接返回团队全部项目", async () => {
    const allProjects = [{ id: "p1" }, { id: "p2" }];
    vi.mocked(db).select = makeSelectMock([allProjects]) as never;

    const viewer = makeViewer({ id: "team-1", role: "admin" });
    const result = await getVisibleProjectsByTenant("team-1", viewer);

    expect(result).toEqual(allProjects);
    // 管理员分支只查询一次(全量项目)
    expect(vi.mocked(db).select).toHaveBeenCalledTimes(1);
  });

  it("销售经理只能看到自己跟踪的项目(无授权时)", async () => {
    // select 调用顺序:授权记录查询(空) → 项目查询
    vi.mocked(db).select = makeSelectMock([[], [{ id: "p1" }]]) as never;

    const viewer = makeViewer({ id: "user-1", role: "sales_manager" });
    const result = await getVisibleProjectsByTenant("team-1", viewer);

    expect(result).toEqual([{ id: "p1" }]);
    // 非全量分支:授权记录 + 项目 两次查询
    expect(vi.mocked(db).select).toHaveBeenCalledTimes(2);
  });

  it("销售经理可看到被管理员授权的项目(授权记录存在)", async () => {
    vi.mocked(db).select = makeSelectMock([
      [{ projectId: "p2" }],
      [{ id: "p1" }, { id: "p2" }],
    ]) as never;

    const viewer = makeViewer({ id: "user-1", role: "sales_manager" });
    const result = await getVisibleProjectsByTenant("team-1", viewer);

    expect(result).toEqual([{ id: "p1" }, { id: "p2" }]);
    expect(vi.mocked(db).select).toHaveBeenCalledTimes(2);
  });
});
