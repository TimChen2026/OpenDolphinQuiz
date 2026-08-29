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

// Dashboard 邮件模板管理(Phase 3 Task 3.4)
//
// 功能:
// - 按租户获取全部邮件模板(报告邮件/Summary/Internal Email/预警等)
// - 按 template_type 更新或插入模板
// - 提供默认模板内容(首次使用、或用户删除后兜底)
//
// 模板正文使用 @变量 占位符,如 @ProjectNo、@CustomerName 等(英文驼峰 token),
// 由具体发送场景渲染时替换

import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailTemplates, EMAIL_TEMPLATE_TYPES } from "@/lib/db/schema";

// 重新导出模板类型常量(供其他模块统一引用)
export { EMAIL_TEMPLATE_TYPES };

// 模板数据类型(不含租户与 id,由服务端填充)
export type EmailTemplateData = {
  templateType: string;
  name: string;
  subject: string;
  body: string;
};

// 默认模板内容:templateType -> { name, subject, body }
// 正文中的 @xxx 为占位变量,发送时按上下文替换
//
// 说明(Phase 3 验收修订 2.1.7.4):
// - 已删除"项目报告邮件(report)"模块,与"内部告知邮件(internal)"重复
// - 询盘通知邮件统一使用 internal 模板,由 internal-email.ts 渲染发送
const DEFAULT_TEMPLATES: Record<string, EmailTemplateData> = {
  [EMAIL_TEMPLATE_TYPES.SUMMARY]: {
    templateType: EMAIL_TEMPLATE_TYPES.SUMMARY,
    name: "Summary digest",
    subject: "Quiz Summary",
    body:
      "Thank you for consulting with us!\n\n" +
      "We understand that you are interested in the following:\n" +
      "@SelectedPath\n\n" +
      "Our sales manager will contact you as soon as possible for detailed communication.\n\n" +
      "Best regards\n" +
      "@Team",
  },
  [EMAIL_TEMPLATE_TYPES.INTERNAL]: {
    templateType: EMAIL_TEMPLATE_TYPES.INTERNAL,
    name: "Internal notification email",
    subject: "[New Inquiry] @ProjectNo - @Topic",
    body:
      "Dear @SalesManager,\n\n" +
      "You have received a new customer inquiry. Please follow up and reply as soon as possible.\n\n" +
      "Customer Name: @CustomerName\n" +
      "Phone Number: @CustomerPhone\n" +
      "Customer Email: @CustomerEmail\n" +
      "Project Number: @ProjectNo\n" +
      "Related Topic: @Topic\n" +
      "Inquiry Time: @InquiryTime\n\n" +
      "Customer quiz selection path:\n" +
      "@SelectedPath\n\n" +
      "@Team",
  },
  [EMAIL_TEMPLATE_TYPES.WARNING_YELLOW]: {
    templateType: EMAIL_TEMPLATE_TYPES.WARNING_YELLOW,
    name: "Yellow warning email",
    subject: "[Important] Project follow-up reminder (Yellow warning) - @ProjectNo",
    body:
      "Dear @SalesManager,\n\n" +
      "[Important Reminder] This project has been ongoing since the inquiry and we have not\n" +
      "received your confirmation reply yet. Please follow up with the customer as soon as possible.\n\n" +
      "Project: @ProjectNo\n" +
      "Duration: @Duration\n" +
      "Customer: @CustomerName\n" +
      "Phone Number: @CustomerPhone\n" +
      "Email: @CustomerEmail\n" +
      "Related Topic: @Topic\n\n" +
      "This email has been copied to the sales director.\n\n" +
      "@Team",
  },
  [EMAIL_TEMPLATE_TYPES.WARNING_RED]: {
    templateType: EMAIL_TEMPLATE_TYPES.WARNING_RED,
    name: "Red warning email",
    subject: "[Important] Project follow-up reminder (Red warning) - @ProjectNo",
    body:
      "Dear @SalesManager,\n\n" +
      "[Important Reminder] This project has been ongoing since the inquiry and we have not\n" +
      "received your confirmation reply yet. Please follow up with the customer immediately!\n\n" +
      "Project: @ProjectNo\n" +
      "Duration: @Duration\n" +
      "Customer: @CustomerName\n" +
      "Phone Number: @CustomerPhone\n" +
      "Email: @CustomerEmail\n" +
      "Related Topic: @Topic\n\n" +
      "This email has been copied to the sales director.\n\n" +
      "@Team",
  },
  [EMAIL_TEMPLATE_TYPES.INQUIRY_NEAR_LIMIT]: {
    templateType: EMAIL_TEMPLATE_TYPES.INQUIRY_NEAR_LIMIT,
    name: "Inquiry near limit reminder",
    subject: "[Important] Today's inquiries @TodayInquiryCount have reached the near-free-plan limit",
    body:
      "Dear Administrator,\n\n" +
      "The market is very active today. So far today's customer inquiries have reached\n" +
      "@TodayInquiryCount, approaching the free plan daily limit of 5.\n" +
      "To keep receiving business smoothly and grow your market share, please consider\n" +
      "upgrading your plan. See: @PricingLink.\n\n" +
      "DolphinQuiz Community: https://dolphinquiz.discourse.group/\n\n" +
      "@Team",
  },
  [EMAIL_TEMPLATE_TYPES.INQUIRY_REACH_LIMIT]: {
    templateType: EMAIL_TEMPLATE_TYPES.INQUIRY_REACH_LIMIT,
    name: "Inquiry limit reached reminder",
    subject: "[Important] Today's inquiries have reached the limit (5/day)",
    body:
      "Dear Administrator,\n\n" +
      "The market is very active today. So far today's customer inquiries have reached\n" +
      "@TodayInquiryCount, hitting the free plan daily limit of 5.\n" +
      "Customers visiting the quiz will see the limit notice, which may affect business.\n" +
      "To keep receiving business smoothly and grow your market share, please consider\n" +
      "upgrading your plan. See: @PricingLink.\n\n" +
      "DolphinQuiz Community: https://dolphinquiz.discourse.group/\n\n" +
      "@Team",
  },
};

/**
 * 获取默认模板内容(按类型)
 */
export function getDefaultTemplate(templateType: string): EmailTemplateData | null {
  return DEFAULT_TEMPLATES[templateType] ?? null;
}

/**
 * 获取租户的全部邮件模板
 *
 * 若某类型模板缺失,返回默认模板兜底,保证界面始终可编辑
 *
 * @param tenantId 租户 ID
 * @returns 按 templateType 索引的模板对象
 */
export async function getEmailTemplatesByTenant(
  tenantId: string
): Promise<Record<string, EmailTemplateData>> {
  const rows = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.tenantId, tenantId));

  const result: Record<string, EmailTemplateData> = {};
  for (const row of rows) {
    result[row.templateType] = {
      templateType: row.templateType,
      name: row.name,
      subject: row.subject,
      body: row.body,
    };
  }

  // 缺失类型用默认模板兜底
  for (const [type, template] of Object.entries(DEFAULT_TEMPLATES)) {
    if (!result[type]) {
      result[type] = template;
    }
  }

  return result;
}

/**
 * 更新或插入指定类型的邮件模板
 *
 * 不存在则插入,存在则更新 subject/body/name
 *
 * @param tenantId 租户 ID
 * @param data 模板内容
 * @throws 模板类型非法时抛出错误
 */
export async function upsertEmailTemplate(
  tenantId: string,
  data: EmailTemplateData
): Promise<void> {
  if (!DEFAULT_TEMPLATES[data.templateType]) {
    throw new Error(`非法模板类型: ${data.templateType}`);
  }

  const existing = await db
    .select({ id: emailTemplates.id })
    .from(emailTemplates)
    .where(
      and(
        eq(emailTemplates.tenantId, tenantId),
        eq(emailTemplates.templateType, data.templateType)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(emailTemplates)
      .set({
        name: data.name,
        subject: data.subject,
        body: data.body,
      })
      .where(eq(emailTemplates.id, existing[0].id));
  } else {
    await db.insert(emailTemplates).values({
      id: crypto.randomUUID(),
      tenantId,
      templateType: data.templateType,
      name: data.name,
      subject: data.subject,
      body: data.body,
    });
  }
}
