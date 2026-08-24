/*
 * Copyright (C) 2026 DolphinQuiz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// 管理后台权限使用汇总(getAdminUsageSummary)测试
//
// 覆盖:
// - 无团队返回空数组
// - 按团队汇总配额使用(管理员/套餐/Quiz/潜在客户),跨月/年周期批量统计

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));

import { getAdminUsageSummary } from "@/lib/admin-usage";
import { db } from "@/lib/db";

// 查询链 mock:select().from().where().groupBy()/limit() 最终 await 返回按调用顺序出队的 rows
function makeSelectMock(rowsQueue: unknown[][]) {
  const queue = rowsQueue.map((rows) => [...rows]);
  return vi.fn(() => {
    const rows = queue.shift() ?? [];
    const chain: {
      then: (resolve: (rows: unknown) => unknown) => Promise<unknown>;
      from: ReturnType<typeof vi.fn>;
      where: ReturnType<typeof vi.fn>;
      groupBy: ReturnType<typeof vi.fn>;
      limit: ReturnType<typeof vi.fn>;
      orderBy: ReturnType<typeof vi.fn>;
      offset: ReturnType<typeof vi.fn>;
    } = {
      then: (resolve) => Promise.resolve(rows).then(resolve),
      from: vi.fn(() => chain),
      where: vi.fn(() => chain),
      groupBy: vi.fn(() => chain),
      limit: vi.fn(() => rows),
      orderBy: vi.fn(() => chain),
      offset: vi.fn(() => chain),
    };
    return chain;
  });
}

describe("getAdminUsageSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("返回空数组当没有团队时", async () => {
    vi.mocked(db).select = makeSelectMock([[]]) as never;

    const summary = await getAdminUsageSummary();

    expect(summary).toEqual([]);
  });

  it("按团队汇总套餐配额使用(年周期套餐)", async () => {
    // select 调用顺序:teams → admins → quiz 计数 → 潜在客户(年)计数
    vi.mocked(db).select = makeSelectMock([
      [{ id: "team-1", name: "Acme" }],
      [{ id: "team-1", name: "Alice", email: "alice@example.com", plan: "pro" }],
      [{ tenantId: "team-1", total: 3 }],
      [{ tenantId: "team-1", total: 1200 }],
    ]) as never;

    const summary = await getAdminUsageSummary();

    expect(summary).toHaveLength(1);
    expect(summary[0]).toMatchObject({
      teamId: "team-1",
      teamName: "Acme",
      adminName: "Alice",
      adminEmail: "alice@example.com",
      plan: "pro",
      quizCount: 3,
      quizLimit: 6,
      potentialCustomerCount: 1200,
      potentialCustomerLimit: 10000,
      potentialCustomerPeriod: "year",
      isQuizLimited: false,
      isPotentialCustomerLimited: false,
    });
  });

  it("套餐达到上限时标记超限(free:1 个 Quiz 已满)", async () => {
    vi.mocked(db).select = makeSelectMock([
      [{ id: "team-2", name: "Beta" }],
      [{ id: "team-2", name: "Bob", email: "bob@example.com", plan: "free" }],
      [{ tenantId: "team-2", total: 1 }],
      [{ tenantId: "team-2", total: 30 }],
    ]) as never;

    const summary = await getAdminUsageSummary();

    expect(summary[0]).toMatchObject({
      plan: "free",
      quizCount: 1,
      quizLimit: 1,
      potentialCustomerCount: 30,
      potentialCustomerLimit: 30,
      potentialCustomerPeriod: "month",
      isQuizLimited: true,
      isPotentialCustomerLimited: true,
    });
  });
});
