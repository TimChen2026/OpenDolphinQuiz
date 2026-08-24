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

// 管理后台 - 权限使用汇总(按团队)
//
// 配额口径(与定价页关键指标一一对应,见 lib/plan-limits.ts):
// - Quiz 问卷数:当前非归档模板数 / 套餐上限
// - 潜在客户数:统计周期内询盘生成的 projects 数 / 套餐上限(周期:month 或 year)
//
// 团队配额共享:团队套餐 = 团队管理员(team.id = 管理员 userId)的 plan,
// 团队成员共享该团队配额,因此按团队(而非个人)汇总展示使用情况。

import { and, count, gte, inArray, lt, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  user,
  team,
  quizTemplates,
  projects,
  QUIZ_TEMPLATE_STATUS,
} from "@/lib/db/schema";
import {
  getPlanLimits,
  getPeriodRange,
  POTENTIAL_CUSTOMER_PERIODS,
  type PotentialCustomerPeriod,
} from "@/lib/plan-limits";

export type AdminUsageSummaryItem = {
  teamId: string;
  teamName: string;
  adminName: string;
  adminEmail: string;
  /** 套餐:free | pro | max(团队套餐 = 团队管理员套餐) */
  plan: string;
  /** 当前 Quiz 问卷数(已用) */
  quizCount: number;
  /** Quiz 问卷上限 */
  quizLimit: number;
  /** 统计周期内潜在客户数(已用) */
  potentialCustomerCount: number;
  /** 潜在客户上限 */
  potentialCustomerLimit: number;
  /** 潜在客户统计周期:month | year */
  potentialCustomerPeriod: PotentialCustomerPeriod;
  /** 今日客户询盘数(已用) */
  dailyInquiryCount: number;
  /** 每日客户询盘上限(null = 无硬上限,Pro/Max) */
  dailyInquiryLimit: number | null;
  /** 本月预警提醒数(已用,黄 + 红) */
  monthlyWarningCount: number;
  /** 每月预警提醒上限(null = 无硬上限,Pro/Max) */
  monthlyWarningLimit: number | null;
  isQuizLimited: boolean;
  isPotentialCustomerLimited: boolean;
  isDailyInquiryLimited: boolean;
  isMonthlyWarningLimited: boolean;
};

/**
 * 获取全部团队(正式用户)的配额使用汇总
 *
 * 仅统计正式用户所属团队(team 表即团队,id 复用团队管理员 userId),
 * Guest 客户无独立配额、不消耗团队额度,不在此表展示。
 */
export async function getAdminUsageSummary(): Promise<AdminUsageSummaryItem[]> {
  const teams = await db
    .select({ id: team.id, name: team.name })
    .from(team);

  if (teams.length === 0) {
    return [];
  }

  const teamIds = teams.map((t) => t.id);

  // 团队管理员信息(team.id = 管理员 userId)
  const admins = await db
    .select({ id: user.id, name: user.name, email: user.email, plan: user.plan })
    .from(user)
    .where(inArray(user.id, teamIds));
  const adminMap = new Map(admins.map((a) => [a.id, a]));

  // Quiz 计数(批量聚合,排除已归档)
  const quizRows = await db
    .select({ tenantId: quizTemplates.tenantId, total: count() })
    .from(quizTemplates)
    .where(
      and(
        inArray(quizTemplates.tenantId, teamIds),
        ne(quizTemplates.status, QUIZ_TEMPLATE_STATUS.ARCHIVED)
      )
    )
    .groupBy(quizTemplates.tenantId);
  const quizCountMap = new Map(
    quizRows.map((row) => [row.tenantId, Number(row.total)])
  );

  // 潜在客户计数:按套餐统计周期分月/年两组批量聚合
  const now = new Date();
  const monthTeamIds: string[] = [];
  const yearTeamIds: string[] = [];
  for (const t of teams) {
    const period = getPlanLimits(adminMap.get(t.id)?.plan ?? "").potentialCustomerPeriod;
    if (period === POTENTIAL_CUSTOMER_PERIODS.MONTH) {
      monthTeamIds.push(t.id);
    } else {
      yearTeamIds.push(t.id);
    }
  }
  const customerCountMap = new Map<string, number>();
  await fillCustomerCounts(customerCountMap, monthTeamIds, POTENTIAL_CUSTOMER_PERIODS.MONTH, now);
  await fillCustomerCounts(customerCountMap, yearTeamIds, POTENTIAL_CUSTOMER_PERIODS.YEAR, now);

  // 今日客户询盘计数(定价页:Free 最多 5 次/天)
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const dailyInquiryCountMap = new Map<string, number>();
  await fillDateCounts(
    dailyInquiryCountMap,
    teamIds,
    projects.inquiryDatetime,
    todayStart,
    todayEnd
  );

  // 本月预警提醒计数(定价页:Free 最多 6 次/月,黄 + 红各记一次)
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  const monthEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );
  const warningCountMap = new Map<string, number>();
  await fillDateCounts(warningCountMap, teamIds, projects.warningYellowAt, monthStart, monthEnd);
  await fillDateCounts(warningCountMap, teamIds, projects.warningRedAt, monthStart, monthEnd);

  return teams.map((t) => {
    const admin = adminMap.get(t.id);
    const plan = admin?.plan ?? "free";
    const limits = getPlanLimits(plan);
    const quizCount = quizCountMap.get(t.id) ?? 0;
    const potentialCustomerCount = customerCountMap.get(t.id) ?? 0;
    const dailyInquiryCount = dailyInquiryCountMap.get(t.id) ?? 0;
    const monthlyWarningCount = warningCountMap.get(t.id) ?? 0;
    return {
      teamId: t.id,
      teamName: t.name,
      adminName: admin?.name ?? "未知用户",
      adminEmail: admin?.email ?? "",
      plan,
      quizCount,
      quizLimit: limits.maxQuizTemplates,
      potentialCustomerCount,
      potentialCustomerLimit: limits.maxPotentialCustomers,
      potentialCustomerPeriod: limits.potentialCustomerPeriod,
      dailyInquiryCount,
      dailyInquiryLimit: limits.dailyInquiryLimit,
      monthlyWarningCount,
      monthlyWarningLimit: limits.monthlyWarningLimit,
      isQuizLimited: quizCount >= limits.maxQuizTemplates,
      isPotentialCustomerLimited:
        potentialCustomerCount >= limits.maxPotentialCustomers,
      isDailyInquiryLimited:
        limits.dailyInquiryLimit !== null &&
        dailyInquiryCount >= limits.dailyInquiryLimit,
      isMonthlyWarningLimited:
        limits.monthlyWarningLimit !== null &&
        monthlyWarningCount >= limits.monthlyWarningLimit,
    };
  });
}

/** 按统计周期批量统计指定团队的潜在客户数(写入 customerCountMap) */
async function fillCustomerCounts(
  customerCountMap: Map<string, number>,
  teamIds: string[],
  period: PotentialCustomerPeriod,
  now: Date
): Promise<void> {
  if (teamIds.length === 0) {
    return;
  }
  const { start, end } = getPeriodRange(period, now);
  await fillDateCounts(
    customerCountMap,
    teamIds,
    projects.inquiryDatetime,
    start,
    end
  );
}

/**
 * 按日期区间批量统计指定团队的记录数(写入 countMap)
 *
 * 支持复用:潜在客户(询盘时间)、今日询盘(询盘时间)、本月预警(黄色/红色预警时间)。
 * 同列多次调用时计数累加(如黄 + 红预警合计)。
 */
async function fillDateCounts(
  countMap: Map<string, number>,
  teamIds: string[],
  dateColumn:
    | typeof projects.inquiryDatetime
    | typeof projects.warningYellowAt
    | typeof projects.warningRedAt,
  start: Date,
  end: Date
): Promise<void> {
  if (teamIds.length === 0) {
    return;
  }
  const rows = await db
    .select({ tenantId: projects.tenantId, total: count() })
    .from(projects)
    .where(
      and(
        inArray(projects.tenantId, teamIds),
        gte(dateColumn, start),
        lt(dateColumn, end)
      )
    )
    .groupBy(projects.tenantId);
  for (const row of rows) {
    countMap.set(row.tenantId, (countMap.get(row.tenantId) ?? 0) + Number(row.total));
  }
}
