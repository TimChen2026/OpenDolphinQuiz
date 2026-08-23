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

// 询盘次数限制逻辑(Phase 3 Task 3.7)
//
// 功能(AC-06):
// - 统计租户当天收到的询盘次数
// - 免费套餐硬上限:5 次/天(达到后客户无法继续 Quiz)
// - >=3 次/天:发提示邮件(发管理员,抄销售负责人)
// - >=5 次/天:再发一次提示邮件(客户访问 Quiz 显示上限提示)
//
// 设计说明:
// - 提示邮件在"当次计数恰好达到阈值"时发送,天然避免重复发送
// - 询盘次数 = 当天 inquiry_datetime 落在当日的 projects 记录数

import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { getEmailTemplatesByTenant, EMAIL_TEMPLATE_TYPES } from "./email-templates";
import { renderTemplate } from "./warning";
import { getSalesDirector } from "./team";

// 免费套餐每日询盘硬上限
export const FREE_DAILY_INQUIRY_LIMIT = 5;
// 接近上限阈值(发提示邮件)
export const INQUIRY_NEAR_LIMIT = 3;

// 询盘限制状态
export type InquiryLimitStatus = {
  count: number;
  limit: number;
  nearLimit: number;
  // 是否已达硬上限(客户无法继续 Quiz)
  isLimited: boolean;
  // 是否接近上限(提示升级)
  isNearLimit: boolean;
};

/**
 * 获取当天的起止时间(UTC)
 */
function getTodayRange(now: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/**
 * 统计租户当天询盘次数
 *
 * @param tenantId 租户 ID
 * @param now 当前时间(便于测试)
 */
export async function countInquiriesToday(
  tenantId: string,
  now: Date = new Date()
): Promise<number> {
  const { start, end } = getTodayRange(now);
  const rows = await db
    .select({ count: projects.id })
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

/**
 * 获取询盘限制状态(纯计算)
 */
export function computeInquiryLimitStatus(
  count: number,
  limit: number = FREE_DAILY_INQUIRY_LIMIT,
  nearLimit: number = INQUIRY_NEAR_LIMIT
): InquiryLimitStatus {
  return {
    count,
    limit,
    nearLimit,
    isLimited: count >= limit,
    isNearLimit: count >= nearLimit && count < limit,
  };
}

/**
 * 获取租户当前询盘限制状态(组合查询 + 计算)
 *
 * @param tenantId 租户 ID
 * @param now 当前时间(便于测试)
 */
export async function getInquiryLimitStatusForTenant(
  tenantId: string,
  now: Date = new Date()
): Promise<InquiryLimitStatus> {
  const count = await countInquiriesToday(tenantId, now);
  return computeInquiryLimitStatus(count);
}

/**
 * 检查并发送询盘次数提示邮件
 *
 * 在每次询盘提交后调用:
 * - count 恰好等于 3:发送"接近上限"邮件
 * - count 恰好等于 5:发送"达到上限"邮件
 *
 * @param tenantId 租户 ID
 * @param adminEmail 管理员邮箱(= 租户本人)
 * @returns 是否发送了提示邮件
 */
export async function maybeSendInquiryLimitEmails(
  tenantId: string,
  adminEmail: string,
  now: Date = new Date()
): Promise<boolean> {
  const count = await countInquiriesToday(tenantId, now);

  // 恰好达到接近上限阈值:发一次提示邮件
  if (count === INQUIRY_NEAR_LIMIT) {
    await sendInquiryLimitEmail(
      tenantId,
      adminEmail,
      EMAIL_TEMPLATE_TYPES.INQUIRY_NEAR_LIMIT,
      count
    );
    return true;
  }

  // 恰好达到硬上限阈值:再发一次提示邮件
  if (count === FREE_DAILY_INQUIRY_LIMIT) {
    await sendInquiryLimitEmail(
      tenantId,
      adminEmail,
      EMAIL_TEMPLATE_TYPES.INQUIRY_REACH_LIMIT,
      count
    );
    return true;
  }

  return false;
}

/**
 * 发送询盘次数提示邮件(发管理员,抄送销售负责人)
 */
async function sendInquiryLimitEmail(
  tenantId: string,
  adminEmail: string,
  templateType: string,
  count: number
): Promise<void> {
  const templates = await getEmailTemplatesByTenant(tenantId);
  const template = templates[templateType];
  if (!template) {
    return;
  }

  // 查询销售负责人(销售总监)用于抄送(按团队隔离)
  const director = await getSalesDirector(tenantId);

  const variables = {
    今日询盘次数: count,
    定价页链接: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/pricing`,
  };

  const subject = renderTemplate(template.subject, variables);
  const body = renderTemplate(template.body, variables);

  await sendEmail({
    to: adminEmail,
    subject,
    text: body,
    ...(director ? { cc: [director.email] } : {}),
  });
}
