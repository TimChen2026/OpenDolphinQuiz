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

// 套餐权限限制(用户权限管理,依据定价方案 /zh/pricing)
//
// 配额说明:
// - Free:1 个 Quiz 问卷 / 每月最多 30 个潜在客户(另有 5 次/天询盘硬上限,见 inquiry-limit.ts)
// - Pro:6 个 Quiz 问卷 / 每年最多 10000 个潜在客户
// - Max:12 个 Quiz 问卷 / 每年最多 30000 个潜在客户
//
// 多租户隔离:每个用户(Pro/Max 即一个 Team)的数据以 tenant_id = user.id 行级隔离,
// 其他用户不可见;超级管理员通过环境变量 SUPER_ADMIN_EMAIL 识别(见 lib/rbac.ts)。

import { and, eq, gte, lt, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, quizTemplates, QUIZ_TEMPLATE_STATUS } from "@/lib/db/schema";
import { USER_PLANS } from "@/lib/db/schema";

// 潜在客户统计周期
export const POTENTIAL_CUSTOMER_PERIODS = {
  MONTH: "month",
  YEAR: "year",
} as const;

export type PotentialCustomerPeriod =
  (typeof POTENTIAL_CUSTOMER_PERIODS)[keyof typeof POTENTIAL_CUSTOMER_PERIODS];

// 各套餐配额(与定价页一一对应)
export const PLAN_LIMITS: Record<
  string,
  {
    maxQuizTemplates: number;
    maxPotentialCustomers: number;
    potentialCustomerPeriod: PotentialCustomerPeriod;
  }
> = {
  [USER_PLANS.FREE]: {
    maxQuizTemplates: 1,
    maxPotentialCustomers: 30,
    potentialCustomerPeriod: POTENTIAL_CUSTOMER_PERIODS.MONTH,
  },
  [USER_PLANS.PRO]: {
    maxQuizTemplates: 6,
    maxPotentialCustomers: 10000,
    potentialCustomerPeriod: POTENTIAL_CUSTOMER_PERIODS.YEAR,
  },
  [USER_PLANS.MAX]: {
    maxQuizTemplates: 12,
    maxPotentialCustomers: 30000,
    potentialCustomerPeriod: POTENTIAL_CUSTOMER_PERIODS.YEAR,
  },
};

/** 获取套餐配额,未知套餐按 Free 处理(最保守) */
export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS[USER_PLANS.FREE];
}

/** 获取统计周期起止时间(UTC,月初/年初 到 下月初/下年初) */
export function getPeriodRange(
  period: PotentialCustomerPeriod,
  now: Date = new Date()
): { start: Date; end: Date } {
  if (period === POTENTIAL_CUSTOMER_PERIODS.YEAR) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1));
    return { start, end };
  }
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );
  return { start, end };
}

/** Quiz 数量限制状态 */
export type QuizLimitStatus = {
  count: number;
  limit: number;
  isLimited: boolean;
};

/** 潜在客户数量限制状态 */
export type PotentialCustomerLimitStatus = {
  count: number;
  limit: number;
  // 统计周期:month | year
  period: PotentialCustomerPeriod;
  isLimited: boolean;
};

/** 统计租户的 Quiz 模板数量(含草稿与激活,不含已归档) */
export async function countQuizTemplatesForTenant(
  tenantId: string
): Promise<number> {
  const rows = await db
    .select({ id: quizTemplates.id })
    .from(quizTemplates)
    .where(
      and(
        eq(quizTemplates.tenantId, tenantId),
        ne(quizTemplates.status, QUIZ_TEMPLATE_STATUS.ARCHIVED)
      )
    );
  return rows.length;
}

/** 统计租户在指定时间段内的潜在客户数(= 时间段内询盘生成的 projects 记录数) */
export async function countPotentialCustomersForTenant(
  tenantId: string,
  start: Date,
  end: Date
): Promise<number> {
  const rows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.tenantId, tenantId),
        gte(projects.inquiryDatetime, start),
        lt(projects.inquiryDatetime, end)
      )
    );
  return rows.length;
}

/** 获取租户 Quiz 数量限制状态(查询 + 计算) */
export async function getQuizLimitStatusForTenant(
  tenantId: string,
  plan: string
): Promise<QuizLimitStatus> {
  const limits = getPlanLimits(plan);
  const count = await countQuizTemplatesForTenant(tenantId);
  return {
    count,
    limit: limits.maxQuizTemplates,
    isLimited: count >= limits.maxQuizTemplates,
  };
}

/** 获取租户潜在客户数量限制状态(查询 + 计算) */
export async function getPotentialCustomerLimitStatusForTenant(
  tenantId: string,
  plan: string,
  now: Date = new Date()
): Promise<PotentialCustomerLimitStatus> {
  const limits = getPlanLimits(plan);
  const { start, end } = getPeriodRange(limits.potentialCustomerPeriod, now);
  const count = await countPotentialCustomersForTenant(tenantId, start, end);
  return {
    count,
    limit: limits.maxPotentialCustomers,
    period: limits.potentialCustomerPeriod,
    isLimited: count >= limits.maxPotentialCustomers,
  };
}
