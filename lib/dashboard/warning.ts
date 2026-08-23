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

// 预警逻辑(Phase 3 Task 3.6/3.10)
//
// 功能(AC-05):
// - 计算项目持续时间与是否超过 3 天
// - 判断预警级别:黄色(>=黄色阈值) / 红色(>=红色阈值)
// - 发送预警邮件(发销售经理,抄送销售总监,加重要标识)
// - DB 登记预警时间(warning_yellow_at / warning_red_at)
//
// 判断前提(需求 2.2.3.16/2.2.3.18):
// 1. 先判断项目是否超过 3 天,超过则不触发预警
// 2. 项目已结束(获单/失单)不触发预警
// 3. 对应级别预警已发送过不重复发送

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, user } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { getWarningSettingsByTenant, DEFAULT_YELLOW_HOURS, DEFAULT_RED_HOURS } from "./warning-settings";
import { getEmailTemplatesByTenant, EMAIL_TEMPLATE_TYPES } from "./email-templates";
import { isProjectEnded } from "./project-status";
import { getSalesDirector } from "./team";

// 预警级别
export type WarningLevel = "none" | "yellow" | "red";

// 预警级别计算参数
export type ComputeWarningParams = {
  projectStatus: string | null;
  over3Days: boolean | null;
  durationHours: number | null;
  yellowHours: number;
  redHours: number;
  yellowSent: boolean;
  redSent: boolean;
};

/**
 * 判断预警级别(纯函数)
 *
 * 优先级:
 * 1. 项目结束 或 超过 3 天 → 不预警
 * 2. 红色预警已发送 → 不再发任何预警(红色为最高级别)
 * 3. 持续时长 >= 红色阈值 → 红色预警
 * 4. 持续时长 >= 黄色阈值 且 黄色未发 → 黄色预警
 * 5. 其余 → 不预警
 */
export function computeWarningLevel(params: ComputeWarningParams): WarningLevel {
  const { projectStatus, over3Days, durationHours, yellowHours, redHours, yellowSent, redSent } = params;

  // 项目结束或超过 3 天:不预警
  if (isProjectEnded(projectStatus) || over3Days === true) {
    return "none";
  }

  const duration = durationHours ?? 0;

  // 红色预警已发送过:不再发送任何预警
  if (redSent) {
    return "none";
  }

  // 红色预警(未发送过)
  if (duration >= redHours) {
    return "red";
  }
  // 黄色预警(未发送过)
  if (duration >= yellowHours && !yellowSent) {
    return "yellow";
  }

  return "none";
}

/**
 * 计算项目持续时间(小时)与是否超过 3 天
 *
 * @param inquiryDatetime 询盘时间
 * @param now 当前时间(默认现在,便于测试)
 * @returns { durationHours, over3Days }
 */
export function computeDuration(
  inquiryDatetime: Date,
  now: Date = new Date()
): { durationHours: number | null; over3Days: boolean } {
  const durationMs = Math.max(0, now.getTime() - inquiryDatetime.getTime());
  const durationHours = durationMs / (1000 * 60 * 60);
  const over3Days = durationHours > 72;
  // 超过 3 天不必再计算持续时间
  return {
    durationHours: over3Days ? null : durationHours,
    over3Days,
  };
}

/**
 * 渲染模板:将 @变量 占位符替换为实际值
 *
 * @param template 模板文本(主题或正文)
 * @param variables 变量映射(@xxx -> 值)
 * @returns 渲染后文本
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string | number>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.split(`@${key}`).join(String(value));
  }
  return result;
}

/**
 * 处理单个租户的预警(供 Cron 调用)
 *
 * 流程:
 * 1. 获取预警设置与邮件模板
 * 2. 遍历项目,计算持续时长并更新 DB
 * 3. 判断预警级别,发送邮件并登记时间
 *
 * @param tenantId 租户 ID
 * @param now 当前时间(便于测试)
 * @returns 本次触发的预警列表
 */
export async function processTenantWarnings(
  tenantId: string,
  now: Date = new Date()
): Promise<{ projectId: string; projectNumber: string; level: WarningLevel }[]> {
  const settings = await getWarningSettingsByTenant(tenantId);
  const templates = await getEmailTemplatesByTenant(tenantId);
  const projectRows = await db
    .select()
    .from(projects)
    .where(eq(projects.tenantId, tenantId));

  const triggered: { projectId: string; projectNumber: string; level: WarningLevel }[] = [];

  for (const project of projectRows) {
    // 已结束项目跳过(并保持 DB 状态)
    if (isProjectEnded(project.projectStatus)) {
      continue;
    }

    // 计算持续时长并回写 DB(数据聚合在 Node.js 后端完成)
    const { durationHours, over3Days } = computeDuration(
      project.inquiryDatetime,
      now
    );
    await db
      .update(projects)
      .set({ durationHours: durationHours !== null ? String(durationHours) : null, over3Days })
      .where(eq(projects.id, project.id));

    const level = computeWarningLevel({
      projectStatus: project.projectStatus,
      over3Days,
      durationHours,
      yellowHours: settings.yellowHours,
      redHours: settings.redHours,
      yellowSent: Boolean(project.warningYellowAt),
      redSent: Boolean(project.warningRedAt),
    });

    if (level === "none") {
      continue;
    }

    // 发送预警邮件
    const templateType =
      level === "yellow"
        ? EMAIL_TEMPLATE_TYPES.WARNING_YELLOW
        : EMAIL_TEMPLATE_TYPES.WARNING_RED;
    const template = templates[templateType];
    if (!template) {
      continue;
    }

    const manager = project.managerId
      ? await db
          .select({ name: user.name, email: user.email })
          .from(user)
          .where(eq(user.id, project.managerId))
          .limit(1)
      : [];
    const director = await getSalesDirector(tenantId);

    // 无销售经理时跳过(预警必须有明确负责人)
    if (manager.length === 0) {
      continue;
    }

    const variables = {
      销售经理: manager[0].name,
      项目编号: project.projectNumber,
      主题: project.theme ?? "未指定",
      客户名: project.customerName,
      客户电话: project.phone ?? "未填写",
      客户邮箱: project.email ?? "未填写",
      持续时间: Math.round(durationHours ?? 0),
      询盘时间: project.inquiryDatetime.toISOString(),
    };

    const subject = renderTemplate(template.subject, variables);
    const body = renderTemplate(template.body, variables);
    const cc = director ? { cc: [director.email] } : {};

    const emailResult = await sendEmail({
      to: manager[0].email,
      subject,
      text: body,
      ...cc,
    });

    if (emailResult.success) {
      // DB 登记预警时间
      const nowTs = new Date();
      await db
        .update(projects)
        .set({
          notificationTime: nowTs,
          ...(level === "yellow" ? { warningYellowAt: nowTs } : { warningRedAt: nowTs }),
        })
        .where(eq(projects.id, project.id));

      triggered.push({
        projectId: project.id,
        projectNumber: project.projectNumber,
        level,
      });
    }
  }

  return triggered;
}

// 默认阈值导出(供界面显示默认值)
export { DEFAULT_YELLOW_HOURS, DEFAULT_RED_HOURS };
