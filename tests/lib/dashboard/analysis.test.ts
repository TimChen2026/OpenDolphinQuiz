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

// 分析数据聚合函数单元测试(Phase 5)
//
// 测试10个纯聚合函数的正确性
// 数据获取与聚合分离(AC-10):聚合函数不依赖数据库,纯函数可测试

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { DashboardProject } from "@/features/dashboard/types";
import {
  computeWeeklyVisits,
  computeHourlyVisits,
  computeMonthlyVisits,
  computeQuarterlyVisits,
  computeYearlyVisits,
  computeThemeVisits,
  computeThemeHourlyVisits,
  computeManagerStatusStats,
  computeManagerThemeStats,
  computeManagerAvgReply,
  computeChartData,
} from "@/lib/dashboard/analysis";

// ==================== 测试夹具 ====================

// 创建一个固定时间的辅助函数(2026-08-14 为当前日期)
function makeProject(overrides: Partial<DashboardProject> = {}): DashboardProject {
  return {
    id: "test-id",
    projectNumber: "TEST-001",
    customerName: "测试客户",
    theme: null,
    phone: null,
    email: null,
    inquiryDatetime: null,
    replyDatetime: null,
    projectStatus: "跟进",
    durationHours: null,
    over3Days: null,
    warningYellowAt: null,
    warningRedAt: null,
    notes: null,
    managerId: null,
    intervalHours: null,
    ...overrides,
  } as DashboardProject;
}

/** 创建指定日期时间的 ISO 字符串 */
function dt(year: number, month: number, day: number, hour = 0, minute = 0): string {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  const h = String(hour).padStart(2, "0");
  const min = String(minute).padStart(2, "0");
  return `${year}-${m}-${d}T${h}:${min}:00.000Z`;
}

// 当前测试基准日期: 2026-08-14
// 聚合函数内部依赖 new Date() 计算"过去一周/一月"等窗口,
// 必须冻结系统时间,否则测试数据会随真实日期漂移而失效
const NOW = new Date("2026-08-14T12:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

// ==================== 1.1 每周访问量分布 ====================

describe("computeWeeklyVisits", () => {
  it("过去一周内按星期正确分组", () => {
    // 2026-08-14 是周五
    // 周一 8/10, 周三 8/12, 周五 8/14
    const projects = [
      makeProject({ inquiryDatetime: dt(2026, 8, 10, 10, 0) }), // 周一
      makeProject({ inquiryDatetime: dt(2026, 8, 10, 14, 0) }), // 周一
      makeProject({ inquiryDatetime: dt(2026, 8, 12, 9, 0) }),  // 周三
      makeProject({ inquiryDatetime: dt(2026, 8, 14, 11, 0) }), // 周五
    ];

    const result = computeWeeklyVisits(projects);
    expect(result).toHaveLength(7);
    // 周一=2, 周三=1, 周五=1, 其他=0
    expect(result.find((r) => r.dayOfWeek === "周一")?.count).toBe(2);
    expect(result.find((r) => r.dayOfWeek === "周三")?.count).toBe(1);
    expect(result.find((r) => r.dayOfWeek === "周五")?.count).toBe(1);
    expect(result.find((r) => r.dayOfWeek === "周二")?.count).toBe(0);
    expect(result.find((r) => r.dayOfWeek === "周日")?.count).toBe(0);
  });

  it("超过一周的项目不计入", () => {
    const projects = [
      makeProject({ inquiryDatetime: dt(2026, 8, 1, 10, 0) }), // 13天前
    ];
    const result = computeWeeklyVisits(projects);
    expect(result.every((r) => r.count === 0)).toBe(true);
  });

  it("inquiryDatetime 为 null 时跳过", () => {
    const projects = [makeProject({ inquiryDatetime: null })];
    const result = computeWeeklyVisits(projects);
    expect(result.every((r) => r.count === 0)).toBe(true);
  });

  it("返回顺序为周一~周日", () => {
    const projects = [makeProject({ inquiryDatetime: dt(2026, 8, 14, 10, 0) })];
    const result = computeWeeklyVisits(projects);
    const expectedOrder = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    result.forEach((r, i) => {
      expect(r.dayOfWeek).toBe(expectedOrder[i]);
    });
  });
});

// ==================== 1.2 访问时区分布 ====================

describe("computeHourlyVisits", () => {
  it("按时段正确分组", () => {
    const projects = [
      makeProject({ inquiryDatetime: dt(2026, 8, 13, 1, 0) }),  // 时段 0-2
      makeProject({ inquiryDatetime: dt(2026, 8, 13, 1, 30) }), // 时段 0-2
      makeProject({ inquiryDatetime: dt(2026, 8, 13, 8, 0) }),  // 时段 8-10
      makeProject({ inquiryDatetime: dt(2026, 8, 13, 15, 0) }), // 时段 14-16
    ];

    const result = computeHourlyVisits(projects);
    expect(result).toHaveLength(12);
    expect(result.find((r) => r.hourRange === "0-2")?.count).toBe(2);
    expect(result.find((r) => r.hourRange === "8-10")?.count).toBe(1);
    expect(result.find((r) => r.hourRange === "14-16")?.count).toBe(1);
    expect(result.find((r) => r.hourRange === "22-24")?.count).toBe(0);
  });

  it("超过一周不计数", () => {
    const projects = [makeProject({ inquiryDatetime: dt(2026, 7, 1, 10, 0) })];
    const result = computeHourlyVisits(projects);
    expect(result.every((r) => r.count === 0)).toBe(true);
  });
});

// ==================== 1.3 每月访问量分布 ====================

describe("computeMonthlyVisits", () => {
  it("过去13个月按月分组", () => {
    const projects = [
      makeProject({ inquiryDatetime: dt(2026, 8, 1, 10, 0) }), // 2026-08
      makeProject({ inquiryDatetime: dt(2026, 8, 5, 10, 0) }), // 2026-08
      makeProject({ inquiryDatetime: dt(2026, 7, 15, 10, 0) }), // 2026-07
    ];

    const result = computeMonthlyVisits(projects);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.find((r) => r.month === "2026-08")?.count).toBe(2);
    expect(result.find((r) => r.month === "2026-07")?.count).toBe(1);
  });

  it("返回13个月(含0值)", () => {
    const projects: DashboardProject[] = [];
    const result = computeMonthlyVisits(projects);
    expect(result).toHaveLength(13);
  });
});

// ==================== 1.4 每季访问量分布 ====================

describe("computeQuarterlyVisits", () => {
  it("按季度正确分组", () => {
    const projects = [
      makeProject({ inquiryDatetime: dt(2026, 1, 15, 10, 0) }), // Q1
      makeProject({ inquiryDatetime: dt(2026, 3, 1, 10, 0) }),  // Q1
      makeProject({ inquiryDatetime: dt(2026, 5, 15, 10, 0) }), // Q2
      makeProject({ inquiryDatetime: dt(2026, 10, 1, 10, 0) }), // Q4
    ];

    const result = computeQuarterlyVisits(projects);
    expect(result).toHaveLength(4);
    expect(result.find((r) => r.quarter === "Q1")?.count).toBe(2);
    expect(result.find((r) => r.quarter === "Q2")?.count).toBe(1);
    expect(result.find((r) => r.quarter === "Q3")?.count).toBe(0);
    expect(result.find((r) => r.quarter === "Q4")?.count).toBe(1);
  });
});

// ==================== 1.5 每年访问量分布 ====================

describe("computeYearlyVisits", () => {
  it("按年正确分组", () => {
    const projects = [
      makeProject({ inquiryDatetime: dt(2025, 1, 1, 10, 0) }),
      makeProject({ inquiryDatetime: dt(2025, 6, 1, 10, 0) }),
      makeProject({ inquiryDatetime: dt(2026, 1, 1, 10, 0) }),
    ];

    const result = computeYearlyVisits(projects);
    expect(result.find((r) => r.year === "2025")?.count).toBe(2);
    expect(result.find((r) => r.year === "2026")?.count).toBe(1);
  });

  it("按年份升序排列", () => {
    const projects = [
      makeProject({ inquiryDatetime: dt(2026, 1, 1, 10, 0) }),
      makeProject({ inquiryDatetime: dt(2025, 1, 1, 10, 0) }),
    ];
    const result = computeYearlyVisits(projects);
    expect(result[0].year).toBe("2025");
    expect(result[1].year).toBe("2026");
  });
});

// ==================== 1.6 主题访问量分布 ====================

describe("computeThemeVisits", () => {
  it("过去一个月按主题分组", () => {
    const projects = [
      makeProject({ theme: "数学", inquiryDatetime: dt(2026, 8, 1, 10, 0) }),
      makeProject({ theme: "数学", inquiryDatetime: dt(2026, 8, 5, 10, 0) }),
      makeProject({ theme: "英语", inquiryDatetime: dt(2026, 8, 10, 10, 0) }),
    ];

    const result = computeThemeVisits(projects);
    expect(result.find((r) => r.theme === "数学")?.count).toBe(2);
    expect(result.find((r) => r.theme === "英语")?.count).toBe(1);
  });

  it("theme 为 null 时跳过", () => {
    const projects = [makeProject({ theme: null, inquiryDatetime: dt(2026, 8, 1, 10, 0) })];
    const result = computeThemeVisits(projects);
    expect(result).toHaveLength(0);
  });

  it("返回按计数降序排列", () => {
    const projects = [
      makeProject({ theme: "A", inquiryDatetime: dt(2026, 8, 1, 10, 0) }),
      makeProject({ theme: "B", inquiryDatetime: dt(2026, 8, 2, 10, 0) }),
      makeProject({ theme: "B", inquiryDatetime: dt(2026, 8, 3, 10, 0) }),
    ];
    const result = computeThemeVisits(projects);
    expect(result[0].theme).toBe("B");
    expect(result[1].theme).toBe("A");
  });
});

// ==================== 1.7 主题访问时区分布 ====================

describe("computeThemeHourlyVisits", () => {
  it("交叉统计正确", () => {
    const projects = [
      makeProject({ theme: "数学", inquiryDatetime: dt(2026, 8, 13, 1, 0) }),  // 0-2
      makeProject({ theme: "数学", inquiryDatetime: dt(2026, 8, 13, 1, 30) }), // 0-2
      makeProject({ theme: "英语", inquiryDatetime: dt(2026, 8, 13, 8, 0) }),  // 8-10
    ];

    const result = computeThemeHourlyVisits(projects);
    expect(result).toHaveLength(12);

    // 时段 0-2 应包含数学计数
    const slot0 = result.find((r) => r.hourRange === "0-2");
    expect(slot0).toBeDefined();
    const mathSeries = slot0!.series.find((s) => s.theme === "数学");
    expect(mathSeries?.count).toBe(2);

    // 时段 8-10 应包含英语计数
    const slot8 = result.find((r) => r.hourRange === "8-10");
    expect(slot8).toBeDefined();
    const engSeries = slot8!.series.find((s) => s.theme === "英语");
    expect(engSeries?.count).toBe(1);
  });

  it("只取前4个主题", () => {
    const projects = [
      makeProject({ theme: "A", inquiryDatetime: dt(2026, 8, 1, 10, 0) }),
      makeProject({ theme: "B", inquiryDatetime: dt(2026, 8, 1, 10, 0) }),
      makeProject({ theme: "C", inquiryDatetime: dt(2026, 8, 1, 10, 0) }),
      makeProject({ theme: "D", inquiryDatetime: dt(2026, 8, 1, 10, 0) }),
      makeProject({ theme: "E", inquiryDatetime: dt(2026, 8, 1, 10, 0) }),
    ];

    const result = computeThemeHourlyVisits(projects);
    expect(result[0].series.length).toBeLessThanOrEqual(4);
  });
});

// ==================== 1.8 销售经理处理项目数量统计 ====================

describe("computeManagerStatusStats", () => {
  it("按经理和状态正确分组", () => {
    const projects = [
      makeProject({ managerId: "经理A", projectStatus: "获单", inquiryDatetime: dt(2026, 8, 1, 10, 0) }),
      makeProject({ managerId: "经理A", projectStatus: "失单", inquiryDatetime: dt(2026, 8, 2, 10, 0) }),
      makeProject({ managerId: "经理A", projectStatus: "跟进", inquiryDatetime: dt(2026, 8, 3, 10, 0) }),
      makeProject({ managerId: "经理B", projectStatus: "获单", inquiryDatetime: dt(2026, 8, 4, 10, 0) }),
    ];

    const result = computeManagerStatusStats(projects);
    const managerA = result.find((r) => r.managerName === "经理A");
    expect(managerA).toBeDefined();
    expect(managerA!.series.find((s) => s.status === "获单")?.count).toBe(1);
    expect(managerA!.series.find((s) => s.status === "失单")?.count).toBe(1);
    expect(managerA!.series.find((s) => s.status === "跟进")?.count).toBe(1);

    const managerB = result.find((r) => r.managerName === "经理B");
    expect(managerB).toBeDefined();
    expect(managerB!.series.find((s) => s.status === "获单")?.count).toBe(1);
  });

  it("managerId 为 null 时归为未分配", () => {
    const projects = [
      makeProject({ managerId: null, projectStatus: "跟进", inquiryDatetime: dt(2026, 8, 1, 10, 0) }),
    ];
    const result = computeManagerStatusStats(projects);
    expect(result.find((r) => r.managerName === "未分配")?.series[2].count).toBe(1);
  });
});

// ==================== 1.9 销售经理处理主题数量统计 ====================

describe("computeManagerThemeStats", () => {
  it("按经理和主题正确分组", () => {
    const projects = [
      makeProject({ managerId: "经理A", theme: "数学", inquiryDatetime: dt(2026, 8, 1, 10, 0) }),
      makeProject({ managerId: "经理A", theme: "数学", inquiryDatetime: dt(2026, 8, 2, 10, 0) }),
      makeProject({ managerId: "经理A", theme: "英语", inquiryDatetime: dt(2026, 8, 3, 10, 0) }),
      makeProject({ managerId: "经理B", theme: "数学", inquiryDatetime: dt(2026, 8, 4, 10, 0) }),
    ];

    const result = computeManagerThemeStats(projects);
    const managerA = result.find((r) => r.managerName === "经理A");
    expect(managerA).toBeDefined();
    const mathSeries = managerA!.series.find((s) => s.theme === "数学");
    expect(mathSeries?.count).toBe(2);
    const engSeries = managerA!.series.find((s) => s.theme === "英语");
    expect(engSeries?.count).toBe(1);
  });

  it("只取前4个主题", () => {
    const projects = [
      makeProject({ managerId: "M1", theme: "A", inquiryDatetime: dt(2026, 8, 1, 10, 0) }),
      makeProject({ managerId: "M1", theme: "B", inquiryDatetime: dt(2026, 8, 1, 10, 0) }),
      makeProject({ managerId: "M1", theme: "C", inquiryDatetime: dt(2026, 8, 1, 10, 0) }),
      makeProject({ managerId: "M1", theme: "D", inquiryDatetime: dt(2026, 8, 1, 10, 0) }),
      makeProject({ managerId: "M1", theme: "E", inquiryDatetime: dt(2026, 8, 1, 10, 0) }),
    ];
    const result = computeManagerThemeStats(projects);
    expect(result[0]?.series.length).toBeLessThanOrEqual(4);
  });
});

// ==================== 1.10 销售经理平均回复时间分布 ====================

describe("computeManagerAvgReply", () => {
  it("计算平均回复时间", () => {
    const projects = [
      makeProject({
        managerId: "经理A",
        intervalHours: "2",
        inquiryDatetime: dt(2026, 8, 1, 10, 0),
      }),
      makeProject({
        managerId: "经理A",
        intervalHours: "4",
        inquiryDatetime: dt(2026, 8, 2, 10, 0),
      }),
      makeProject({
        managerId: "经理B",
        intervalHours: "3",
        inquiryDatetime: dt(2026, 8, 3, 10, 0),
      }),
    ];

    const result = computeManagerAvgReply(projects);
    const managerA = result.find((r) => r.managerName === "经理A");
    expect(managerA).toBeDefined();
    expect(managerA!.avgHours).toBe(3); // (2+4)/2 = 3

    const managerB = result.find((r) => r.managerName === "经理B");
    expect(managerB).toBeDefined();
    expect(managerB!.avgHours).toBe(3);
  });

  it("intervalHours 为 null 时跳过", () => {
    const projects = [
      makeProject({
        managerId: "经理A",
        intervalHours: null,
        inquiryDatetime: dt(2026, 8, 1, 10, 0),
      }),
    ];
    const result = computeManagerAvgReply(projects);
    expect(result).toHaveLength(0);
  });

  it("按平均时间降序排列", () => {
    const projects = [
      makeProject({ managerId: "慢经理", intervalHours: "10", inquiryDatetime: dt(2026, 8, 1, 10, 0) }),
      makeProject({ managerId: "快经理", intervalHours: "1", inquiryDatetime: dt(2026, 8, 1, 10, 0) }),
    ];
    const result = computeManagerAvgReply(projects);
    expect(result[0].managerName).toBe("慢经理");
    expect(result[1].managerName).toBe("快经理");
  });
});

// ==================== 统一调度函数 ====================

describe("computeChartData", () => {
  it("chart=1 返回每周访问量", () => {
    const projects = [makeProject({ inquiryDatetime: dt(2026, 8, 14, 10, 0) })];
    const result = computeChartData(projects, 1) as { dayOfWeek: string; count: number }[];
    expect(result.length).toBe(7);
    expect(result[4].dayOfWeek).toBe("周五"); // 2026-08-14 是周五
    expect(result[4].count).toBe(1);
  });

  it("chart=2 返回时区分布", () => {
    const projects = [makeProject({ inquiryDatetime: dt(2026, 8, 13, 10, 0) })];
    const result = computeChartData(projects, 2) as { hourRange: string; count: number }[];
    expect(result).toHaveLength(12);
  });

  it("chart=3 返回每月访问量", () => {
    const result = computeChartData([], 3) as { month: string; count: number }[];
    expect(result).toHaveLength(13);
  });

  it("chart=4 返回季度分布", () => {
    const result = computeChartData([], 4) as { quarter: string; count: number }[];
    expect(result).toHaveLength(4);
  });

  it("chart=5 返回年份分布", () => {
    const projects = [makeProject({ inquiryDatetime: dt(2026, 1, 1, 10, 0) })];
    const result = computeChartData(projects, 5) as { year: string; count: number }[];
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("chart=6 返回主题分布", () => {
    const projects = [makeProject({ theme: "数学", inquiryDatetime: dt(2026, 8, 1, 10, 0) })];
    const result = computeChartData(projects, 6) as { theme: string; count: number }[];
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("chart=7 返回主题时区交叉统计", () => {
    const projects = [makeProject({ theme: "数学", inquiryDatetime: dt(2026, 8, 1, 10, 0) })];
    const result = computeChartData(projects, 7) as { hourRange: string; series: { theme: string; count: number }[] }[];
    expect(result).toHaveLength(12);
  });

  it("chart=8 返回经理状态统计", () => {
    const projects = [makeProject({ managerId: "M1", projectStatus: "跟进", inquiryDatetime: dt(2026, 8, 1, 10, 0) })];
    const result = computeChartData(projects, 8) as { managerName: string; series: { status: string; count: number }[] }[];
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("chart=9 返回经理主题统计", () => {
    const projects = [makeProject({ managerId: "M1", theme: "数学", inquiryDatetime: dt(2026, 8, 1, 10, 0) })];
    const result = computeChartData(projects, 9) as { managerName: string; series: { theme: string; count: number }[] }[];
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("chart=10 返回经理平均回复时间", () => {
    const projects = [makeProject({ managerId: "M1", intervalHours: "5", inquiryDatetime: dt(2026, 8, 1, 10, 0) })];
    const result = computeChartData(projects, 10) as { managerName: string; avgHours: number }[];
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it("chart=99 返回空数组(无效图表)", () => {
    const result = computeChartData([], 99);
    expect(result).toEqual([]);
  });
});