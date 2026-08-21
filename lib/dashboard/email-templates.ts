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
// 模板正文使用 @变量 占位符,如 @客户名、@项目编号 等,
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
    name: "Summary 摘要模板",
    subject: "Quiz 结果摘要 - @项目编号",
    body:
      "感谢您完成 Quiz 问卷!\n\n" +
      "项目编号:@项目编号\n" +
      "选择路径:\n@选择路径\n\n" +
      "关联主题:@主题\n\n@用户 团队",
  },
  [EMAIL_TEMPLATE_TYPES.INTERNAL]: {
    templateType: EMAIL_TEMPLATE_TYPES.INTERNAL,
    name: "内部告知邮件",
    subject: "[新询盘] @项目编号 - @主题",
    body:
      "尊敬的@销售经理,\n\n" +
      "您收到一条新的客户询盘,请尽快跟进回复。\n" +
      "客户姓名:@客户名\n联系电话:@客户电话\n客户邮箱:@客户邮箱\n" +
      "项目编号:@项目编号\n关联主题:@主题\n询盘时间:@询盘时间\n\n" +
      "客户 Quiz 选择路径:\n@选择路径\n\n@用户 团队",
  },
  [EMAIL_TEMPLATE_TYPES.WARNING_YELLOW]: {
    templateType: EMAIL_TEMPLATE_TYPES.WARNING_YELLOW,
    name: "黄色预警邮件",
    subject: "【重要】项目跟进提醒(黄色预警) - @项目编号",
    body:
      "尊敬的@销售经理,\n\n" +
      "【重要提醒】项目@项目编号自询盘以来已持续 @持续时间 小时," +
      "尚未收到您的回复确认,请尽快跟进客户。\n\n" +
      "客户姓名:@客户名\n联系电话:@客户电话\n客户邮箱:@客户邮箱\n" +
      "关联主题:@主题\n\n此邮件已抄送销售总监。\n\n@用户 团队",
  },
  [EMAIL_TEMPLATE_TYPES.WARNING_RED]: {
    templateType: EMAIL_TEMPLATE_TYPES.WARNING_RED,
    name: "红色预警邮件",
    subject: "【紧急】项目跟进提醒(红色预警) - @项目编号",
    body:
      "尊敬的@销售经理,\n\n" +
      "【紧急提醒】项目@项目编号自询盘以来已持续 @持续时间 小时," +
      "超过红色预警阈值,请立即跟进处理!\n\n" +
      "客户姓名:@客户名\n联系电话:@客户电话\n客户邮箱:@客户邮箱\n" +
      "关联主题:@主题\n\n此邮件已抄送销售总监。\n\n@用户 团队",
  },
  [EMAIL_TEMPLATE_TYPES.INQUIRY_NEAR_LIMIT]: {
    templateType: EMAIL_TEMPLATE_TYPES.INQUIRY_NEAR_LIMIT,
    name: "询盘接近上限提醒",
    subject: "【重要】今日询盘次数已达 @今日询盘次数 次,接近免费套餐上限",
    body:
      "管理员您好,\n\n" +
      "由于今天市场十分活跃,到目前为止,客户询盘已达 @今日询盘次数 次," +
      "已接近免费套餐每日 5 次的上限。\n" +
      "为了不影响团队顺利承接业务,扩大贵司市场份额,建议您考虑升级套餐,详见:@定价页链接。\n\n" +
      "DolphinQuiz 社区:https://dolphinquiz.discourse.group/\n\n@用户 团队",
  },
  [EMAIL_TEMPLATE_TYPES.INQUIRY_REACH_LIMIT]: {
    templateType: EMAIL_TEMPLATE_TYPES.INQUIRY_REACH_LIMIT,
    name: "询盘达到上限提醒",
    subject: "【紧急】今日询盘次数已达上限(5次/天)",
    body:
      "管理员您好,\n\n" +
      "由于今天市场十分活跃,到目前为止,客户询盘已达 @今日询盘次数 次," +
      "已达到免费套餐每日 5 次的上限。\n" +
      "客户访问 Quiz 时将看到上限提示,将影响业务承接。\n" +
      "为了不影响团队顺利承接业务,扩大贵司市场份额,建议您考虑升级套餐,详见:@定价页链接。\n\n" +
      "DolphinQuiz 社区:https://dolphinquiz.discourse.group/\n\n@用户 团队",
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
