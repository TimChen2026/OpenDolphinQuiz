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
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// 套餐权限限制单元测试(用户权限管理)

import { describe, it, expect } from "vitest";
import {
  getPlanLimits,
  getPeriodRange,
  PLAN_LIMITS,
} from "@/lib/plan-limits";

describe("PLAN_LIMITS 配额与定价方案一致", () => {
  it("Free:1 个 Quiz / 每月 30 个潜在客户 / 每日询盘 5 次 / 每月预警 6 次", () => {
    expect(PLAN_LIMITS.free).toEqual({
      maxQuizTemplates: 1,
      maxPotentialCustomers: 30,
      potentialCustomerPeriod: "month",
      dailyInquiryLimit: 5,
      monthlyWarningLimit: 6,
    });
  });

  it("Pro:6 个 Quiz / 每年 10000 个潜在客户(无每日询盘/每月预警硬上限)", () => {
    expect(PLAN_LIMITS.pro).toEqual({
      maxQuizTemplates: 6,
      maxPotentialCustomers: 10000,
      potentialCustomerPeriod: "year",
      dailyInquiryLimit: null,
      monthlyWarningLimit: null,
    });
  });

  it("Max:12 个 Quiz / 每年 30000 个潜在客户(无每日询盘/每月预警硬上限)", () => {
    expect(PLAN_LIMITS.max).toEqual({
      maxQuizTemplates: 12,
      maxPotentialCustomers: 30000,
      potentialCustomerPeriod: "year",
      dailyInquiryLimit: null,
      monthlyWarningLimit: null,
    });
  });
});

describe("getPlanLimits", () => {
  it("未知套餐按 Free 保守处理", () => {
    const limits = getPlanLimits("unknown-plan");
    expect(limits).toBe(PLAN_LIMITS.free);
  });

  it("空字符串按 Free 处理", () => {
    expect(getPlanLimits("")).toBe(PLAN_LIMITS.free);
  });

  it("合法套餐返回对应配额", () => {
    expect(getPlanLimits("pro").maxQuizTemplates).toBe(6);
    expect(getPlanLimits("max").maxQuizTemplates).toBe(12);
  });
});

describe("getPeriodRange", () => {
  it("month 周期返回当月月初到下月月初(UTC)", () => {
    const now = new Date("2026-08-23T15:30:00.000Z");
    const { start, end } = getPeriodRange("month", now);
    expect(start.toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });

  it("year 周期返回当年年初到次年年初(UTC)", () => {
    const now = new Date("2026-08-23T15:30:00.000Z");
    const { start, end } = getPeriodRange("year", now);
    expect(start.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("year 周期跨年边界正确(12月31日仍属当年)", () => {
    const now = new Date("2026-12-31T23:59:59.000Z");
    const { start, end } = getPeriodRange("year", now);
    expect(start.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("month 周期12月正确跨到次年1月", () => {
    const now = new Date("2026-12-15T00:00:00.000Z");
    const { start, end } = getPeriodRange("month", now);
    expect(start.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});
