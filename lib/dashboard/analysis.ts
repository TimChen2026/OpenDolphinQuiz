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

// 分析数据聚合函数(Phase 5,AC-10)
//
// 功能:提供10个纯聚合函数,接收项目数据数组,返回聚合结果
// 数据获取与聚合分离(AC-10):本模块仅做数据聚合,数据获取由调用方(API层)完成
// 所有聚合函数均为纯函数,不依赖数据库,方便测试

import type { DashboardProject } from "@/features/dashboard/types";

// ==================== 导出类型定义 ====================

/** 每周访问量分布 */
export type WeeklyVisits = { dayOfWeek: string; count: number };

/** 访问时区分布 */
export type HourlyVisits = { hourRange: string; count: number };

/** 每月访问量分布 */
export type MonthlyVisits = { month: string; count: number };

/** 每季访问量分布 */
export type QuarterlyVisits = { quarter: string; count: number };

/** 每年访问量分布 */
export type YearlyVisits = { year: string; count: number };

/** 主题访问量分布 */
export type ThemeVisits = { theme: string; count: number };

/** 主题访问时区分布(交叉统计) */
export type ThemeHourlyVisits = {
  hourRange: string;
  series: { theme: string; count: number }[];
};

/** 销售经理处理项目数量统计(按状态) */
export type ManagerStatusStats = {
  managerName: string;
  series: { status: string; count: number }[];
};

/** 销售经理处理主题数量统计 */
export type ManagerThemeStats = {
  managerName: string;
  series: { theme: string; count: number }[];
};

/** 销售经理平均回复时间分布 */
export type ManagerAvgReply = { managerName: string; avgHours: number };

// ==================== 辅助函数 ====================

/** 获取 N 天前的日期起始(UTC) */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** 获取 N 个月前的日期起始(UTC) */
function monthsAgo(n: number): Date {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - n);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** 解析日期字符串,返回 Date 或 null */
function parseDate(val: string | null | undefined): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/** 获取小时数(0-23,使用UTC) */
function getHour(val: string | null | undefined): number | null {
  const d = parseDate(val);
  return d ? d.getUTCHours() : null;
}

/** 获取星期几(0=Sunday, 6=Saturday,使用UTC) */
function getDayOfWeek(val: string | null | undefined): number | null {
  const d = parseDate(val);
  return d ? d.getUTCDay() : null;
}

/** 星期数字映射为中文名 */
const DAY_NAMES_CN: Record<number, string> = {
  0: "周日",
  1: "周一",
  2: "周二",
  3: "周三",
  4: "周四",
  5: "周五",
  6: "周六",
};

/** 时段范围映射 */
const HOUR_RANGES: string[] = [
  "0-2", "2-4", "4-6", "6-8", "8-10", "10-12",
  "12-14", "14-16", "16-18", "18-20", "20-22", "22-24",
];

/** 获取小时对应的时段索引(0-11) */
function getHourRangeIndex(hour: number): number {
  return Math.floor(hour / 2);
}

/** 获取月份字符串 YYYY-MM(使用UTC) */
function getMonthStr(val: string | null | undefined): string | null {
  const d = parseDate(val);
  return d
    ? `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
    : null;
}

/** 获取季度 Q1-Q4(使用UTC) */
function getQuarter(val: string | null | undefined): string | null {
  const d = parseDate(val);
  if (!d) return null;
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  return `Q${q}`;
}

/** 获取年份字符串(使用UTC) */
function getYearStr(val: string | null | undefined): string | null {
  const d = parseDate(val);
  return d ? String(d.getUTCFullYear()) : null;
}

// ==================== 1.1 每周访问量分布 ====================

/**
 * 过去一周,按星期分组统计访问量
 * @param projects 项目列表
 * @returns 按星期排序的访问量数组
 */
export function computeWeeklyVisits(
  projects: DashboardProject[]
): WeeklyVisits[] {
  const start = daysAgo(7);
  const filtered = projects.filter((p) => {
    const d = parseDate(p.inquiryDatetime);
    return d && d >= start;
  });

  // 按星期分组计数
  const map = new Map<number, number>();
  for (const p of filtered) {
    const dow = getDayOfWeek(p.inquiryDatetime);
    if (dow !== null) {
      map.set(dow, (map.get(dow) ?? 0) + 1);
    }
  }

  // 返回周一~周日(1~7, PostgreSQL DOW: 0=Sun)
  // 映射: JS 0=Sun → 7, 1=Mon → 1, ..., 6=Sat → 6
  const order = [1, 2, 3, 4, 5, 6, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
  return order.map((dow) => ({
    dayOfWeek: DAY_NAMES_CN[dow],
    count: map.get(dow) ?? 0,
  }));
}

// ==================== 1.2 访问时区分布 ====================

/**
 * 过去一周,按每2小时一段分组统计访问量
 * @param projects 项目列表
 * @returns 按时段排序的访问量数组
 */
export function computeHourlyVisits(
  projects: DashboardProject[]
): HourlyVisits[] {
  const start = daysAgo(7);
  const filtered = projects.filter((p) => {
    const d = parseDate(p.inquiryDatetime);
    return d && d >= start;
  });

  // 按时段分组计数
  const counts = new Array(12).fill(0);
  for (const p of filtered) {
    const hour = getHour(p.inquiryDatetime);
    if (hour !== null) {
      const idx = getHourRangeIndex(hour);
      counts[idx]++;
    }
  }

  return HOUR_RANGES.map((hourRange, i) => ({
    hourRange,
    count: counts[i],
  }));
}

// ==================== 1.3 每月访问量分布 ====================

/**
 * 过去13个月,按月分组统计访问量
 * @param projects 项目列表
 * @returns 按月排序的访问量数组
 */
export function computeMonthlyVisits(
  projects: DashboardProject[]
): MonthlyVisits[] {
  const start = monthsAgo(13);
  const filtered = projects.filter((p) => {
    const d = parseDate(p.inquiryDatetime);
    return d && d >= start;
  });

  // 按月分组计数
  const map = new Map<string, number>();
  for (const p of filtered) {
    const month = getMonthStr(p.inquiryDatetime);
    if (month) {
      map.set(month, (map.get(month) ?? 0) + 1);
    }
  }

  // 生成过去13个月列表并排序
  const months: string[] = [];
  for (let i = 12; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }

  return months.map((month) => ({
    month,
    count: map.get(month) ?? 0,
  }));
}

// ==================== 1.4 每季访问量分布 ====================

/**
 * 按季度分组统计访问量
 * @param projects 项目列表
 * @returns Q1-Q4 访问量数组
 */
export function computeQuarterlyVisits(
  projects: DashboardProject[]
): QuarterlyVisits[] {
  // 统计所有项目(无时间范围限制)
  const counts: Record<string, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
  for (const p of projects) {
    const q = getQuarter(p.inquiryDatetime);
    if (q && counts[q] !== undefined) {
      counts[q]++;
    }
  }

  return ["Q1", "Q2", "Q3", "Q4"].map((quarter) => ({
    quarter,
    count: counts[quarter],
  }));
}

// ==================== 1.5 每年访问量分布 ====================

/**
 * 按年分组统计访问量
 * @param projects 项目列表
 * @returns 按年排序的访问量数组
 */
export function computeYearlyVisits(
  projects: DashboardProject[]
): YearlyVisits[] {
  const map = new Map<string, number>();
  for (const p of projects) {
    const year = getYearStr(p.inquiryDatetime);
    if (year) {
      map.set(year, (map.get(year) ?? 0) + 1);
    }
  }

  return Array.from(map.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year.localeCompare(b.year));
}

// ==================== 1.6 主题访问量分布 ====================

/**
 * 过去一个月,按主题分组统计访问量
 * @param projects 项目列表
 * @returns 按主题排序的访问量数组
 */
export function computeThemeVisits(
  projects: DashboardProject[]
): ThemeVisits[] {
  const start = monthsAgo(1);
  const filtered = projects.filter((p) => {
    const d = parseDate(p.inquiryDatetime);
    return d && d >= start;
  });

  const map = new Map<string, number>();
  for (const p of filtered) {
    if (p.theme) {
      map.set(p.theme, (map.get(p.theme) ?? 0) + 1);
    }
  }

  return Array.from(map.entries())
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count);
}

// ==================== 1.7 主题访问时区分布 ====================

/**
 * 过去一个月,按12时段×4主题交叉统计
 * @param projects 项目列表
 * @returns 每个时段包含各主题的计数
 */
export function computeThemeHourlyVisits(
  projects: DashboardProject[]
): ThemeHourlyVisits[] {
  const start = monthsAgo(1);
  const filtered = projects.filter((p) => {
    const d = parseDate(p.inquiryDatetime);
    return d && d >= start;
  });

  // 收集所有主题,取前4个
  const themeCounts = new Map<string, number>();
  for (const p of filtered) {
    if (p.theme) {
      themeCounts.set(p.theme, (themeCounts.get(p.theme) ?? 0) + 1);
    }
  }
  const topThemes = Array.from(themeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([theme]) => theme);

  // 12时段 × 主题 交叉统计
  // counts[hourIdx][themeIdx] = count
  const counts: number[][] = Array.from({ length: 12 }, () =>
    new Array(topThemes.length).fill(0)
  );

  for (const p of filtered) {
    const hour = getHour(p.inquiryDatetime);
    if (hour === null || !p.theme) continue;
    const hourIdx = getHourRangeIndex(hour);
    const themeIdx = topThemes.indexOf(p.theme);
    if (themeIdx >= 0) {
      counts[hourIdx][themeIdx]++;
    }
  }

  return HOUR_RANGES.map((hourRange, i) => ({
    hourRange,
    series: topThemes.map((theme, j) => ({
      theme,
      count: counts[i][j],
    })),
  }));
}

// ==================== 1.8 销售经理处理项目数量统计 ====================

/**
 * 过去一个月,按经理×项目状态(won/lost/follow_up)统计
 * @param projects 项目列表
 * @returns 每个经理包含各状态计数
 */
export function computeManagerStatusStats(
  projects: DashboardProject[]
): ManagerStatusStats[] {
  const start = monthsAgo(1);
  const filtered = projects.filter((p) => {
    const d = parseDate(p.inquiryDatetime);
    return d && d >= start;
  });

  // 由于经理名在 projects 中不直接存储,提取 managerId 作为临时标识
  // 实际应用中,调用方应提供经理名映射
  // 这里简化处理:按 managerId 分组,用 managerId 作为名称
  const map = new Map<
    string,
    { won: number; lost: number; follow_up: number }
  >();

  for (const p of filtered) {
    // 使用 managerId 作为分组键,若无则归为"Unassigned"
    const key = p.managerId ?? "Unassigned";
    if (!map.has(key)) {
      map.set(key, { won: 0, lost: 0, follow_up: 0 });
    }
    const entry = map.get(key)!;
    if (p.projectStatus === "won") entry.won++;
    else if (p.projectStatus === "lost") entry.lost++;
    else entry.follow_up++;
  }

  return Array.from(map.entries()).map(([managerName, counts]) => ({
    managerName,
    series: [
      { status: "won", count: counts.won },
      { status: "lost", count: counts.lost },
      { status: "follow_up", count: counts.follow_up },
    ],
  }));
}

// ==================== 1.9 销售经理处理主题数量统计 ====================

/**
 * 过去一个月,按主题×经理统计
 * @param projects 项目列表
 * @returns 每个经理包含各主题计数
 */
export function computeManagerThemeStats(
  projects: DashboardProject[]
): ManagerThemeStats[] {
  const start = monthsAgo(1);
  const filtered = projects.filter((p) => {
    const d = parseDate(p.inquiryDatetime);
    return d && d >= start;
  });

  // 收集所有主题,取前4个
  const themeCounts = new Map<string, number>();
  for (const p of filtered) {
    if (p.theme) {
      themeCounts.set(p.theme, (themeCounts.get(p.theme) ?? 0) + 1);
    }
  }
  const topThemes = Array.from(themeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([theme]) => theme);

  // 经理 × 主题 交叉统计
  const managerMap = new Map<string, number[]>();
  for (const p of filtered) {
    if (!p.theme) continue;
    const themeIdx = topThemes.indexOf(p.theme);
    if (themeIdx < 0) continue;
    const key = p.managerId ?? "未分配";
    if (!managerMap.has(key)) {
      managerMap.set(key, new Array(topThemes.length).fill(0));
    }
    managerMap.get(key)![themeIdx]++;
  }

  return Array.from(managerMap.entries()).map(([managerName, counts]) => ({
    managerName,
    series: topThemes.map((theme, i) => ({
      theme,
      count: counts[i],
    })),
  }));
}

// ==================== 1.10 销售经理平均回复时间分布 ====================

/**
 * 过去一个月,按经理平均 interval_hours 统计
 * @param projects 项目列表
 * @returns 每个经理的平均回复时间
 */
export function computeManagerAvgReply(
  projects: DashboardProject[]
): ManagerAvgReply[] {
  const start = monthsAgo(1);
  const filtered = projects.filter((p) => {
    const d = parseDate(p.inquiryDatetime);
    return d && d >= start;
  });

  // 按经理分组,计算平均 intervalHours
  const sumMap = new Map<string, { sum: number; count: number }>();
  for (const p of filtered) {
    if (p.intervalHours === null || p.intervalHours === undefined) continue;
    const hours = Number(p.intervalHours);
    if (isNaN(hours)) continue;
    const key = p.managerId ?? "未分配";
    if (!sumMap.has(key)) {
      sumMap.set(key, { sum: 0, count: 0 });
    }
    const entry = sumMap.get(key)!;
    entry.sum += hours;
    entry.count++;
  }

  return Array.from(sumMap.entries())
    .map(([managerName, { sum, count }]) => ({
      managerName,
      avgHours: count > 0 ? Math.round((sum / count) * 100) / 100 : 0,
    }))
    .sort((a, b) => b.avgHours - a.avgHours);
}

// ==================== 统一调度函数 ====================

/**
 * 根据图表编号调用对应聚合函数
 * @param projects 项目列表
 * @param chartNumber 图表编号 1-10
 * @returns 对应图表数据
 */
export function computeChartData(
  projects: DashboardProject[],
  chartNumber: number
):
  | WeeklyVisits[]
  | HourlyVisits[]
  | MonthlyVisits[]
  | QuarterlyVisits[]
  | YearlyVisits[]
  | ThemeVisits[]
  | ThemeHourlyVisits[]
  | ManagerStatusStats[]
  | ManagerThemeStats[]
  | ManagerAvgReply[] {
  switch (chartNumber) {
    case 1:
      return computeWeeklyVisits(projects);
    case 2:
      return computeHourlyVisits(projects);
    case 3:
      return computeMonthlyVisits(projects);
    case 4:
      return computeQuarterlyVisits(projects);
    case 5:
      return computeYearlyVisits(projects);
    case 6:
      return computeThemeVisits(projects);
    case 7:
      return computeThemeHourlyVisits(projects);
    case 8:
      return computeManagerStatusStats(projects);
    case 9:
      return computeManagerThemeStats(projects);
    case 10:
      return computeManagerAvgReply(projects);
    default:
      return [];
  }
}