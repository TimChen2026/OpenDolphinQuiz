/*
 * Copyright (C) 2026 DolphinQuiz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// 客户升级端点测试
//
// 覆盖:
// - 未登录返回 401
// - 非客户账号返回 400
// - 团队名称为空返回 400
// - 升级成功:accountType 改为 member,清理 customer 归属,调用 joinTeamByName

import { describe, it, expect, vi, beforeEach } from "vitest";

// mock auth 会话
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// mock db:update/select/delete/transaction 链
vi.mock("@/lib/db", () => ({ db: {} }));

vi.mock("@/lib/teams", () => ({
  joinTeamByName: vi.fn(),
}));

import { POST } from "@/app/api/auth/customer-upgrade/route";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { joinTeamByName } from "@/lib/teams";
import * as schema from "@/lib/db/schema";

// 查询链 mock:select().from().where().limit()
// 关键:limit() 直接返回 rows,await 后得到数组
function makeSelectMock(rows: unknown[]) {
  const chain = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    limit: vi.fn(() => rows),
    orderBy: vi.fn(() => chain),
  };
  return vi.fn(() => chain);
}

// update 链 mock:update(table).set(...).where(...)
function makeUpdateMock() {
  const whereMock = vi.fn().mockResolvedValue(undefined);
  const setMock = vi.fn(() => ({ where: whereMock }));
  return {
    setMock,
    updateFn: vi.fn(() => ({ set: setMock })),
  };
}

// delete 链 mock:delete(table).where(...)
function makeDeleteMock() {
  return {
    deleteFn: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
  };
}

// 事务 mock:transaction(cb) 直接执行回调,传入携带 update/delete 链的 tx
function makeTransactionMock() {
  const { updateFn, setMock } = makeUpdateMock();
  const { deleteFn } = makeDeleteMock();
  const transactionFn = vi.fn(async (cb: (tx: unknown) => Promise<void>) => {
    await cb({ update: updateFn, delete: deleteFn });
  });
  return { transactionFn, setMock, deleteFn };
}

describe("customer-upgrade 端点", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("未登录返回 401", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const res = await POST(
      new Request("http://localhost/api/auth/customer-upgrade", {
        method: "POST",
        body: JSON.stringify({ teamName: "Acme" }),
      })
    );

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("未登录");
  });

  it("非客户账号返回 400", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" },
      session: { userId: "user-1" },
    } as never);

    // 当前账号为 member(非 customer)
    vi.mocked(db).select = makeSelectMock([
      { accountType: schema.ACCOUNT_TYPES.MEMBER },
    ]) as never;

    const res = await POST(
      new Request("http://localhost/api/auth/customer-upgrade", {
        method: "POST",
        body: JSON.stringify({ teamName: "Acme" }),
      })
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("仅客户账号");
  });

  it("团队名称为空返回 400", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "customer-1", email: "customer@example.com" },
      session: { userId: "customer-1" },
    } as never);

    vi.mocked(db).select = makeSelectMock([
      { accountType: schema.ACCOUNT_TYPES.CUSTOMER },
    ]) as never;

    const res = await POST(
      new Request("http://localhost/api/auth/customer-upgrade", {
        method: "POST",
        body: JSON.stringify({ teamName: "   " }),
      })
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("团队/公司名称不能为空");
  });

  it("升级成功:accountType 改为 member,清理 customer 归属并加入团队", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "customer-1", email: "customer@example.com" },
      session: { userId: "customer-1" },
    } as never);

    vi.mocked(db).select = makeSelectMock([
      { accountType: schema.ACCOUNT_TYPES.CUSTOMER },
    ]) as never;

    const { updateFn } = makeUpdateMock();
    const { deleteFn } = makeDeleteMock();
    // 事务内 update/delete 使用 tx 上的链
    const { transactionFn, setMock, deleteFn: txDeleteFn } =
      makeTransactionMock();
    vi.mocked(db).update = updateFn as never;
    vi.mocked(db).delete = deleteFn as never;
    vi.mocked(db).transaction = transactionFn as never;
    vi.mocked(joinTeamByName).mockResolvedValue({
      id: "team-1",
      name: "Acme",
    } as never);

    const res = await POST(
      new Request("http://localhost/api/auth/customer-upgrade", {
        method: "POST",
        body: JSON.stringify({ teamName: "Acme" }),
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    // 事务内 accountType 改为 member
    expect(setMock).toHaveBeenCalledWith({
      accountType: schema.ACCOUNT_TYPES.MEMBER,
    });
    // 事务内清理 customer 角色的团队归属
    expect(txDeleteFn).toHaveBeenCalled();
    // 加入团队
    expect(joinTeamByName).toHaveBeenCalledWith("customer-1", "Acme");
  });
});
