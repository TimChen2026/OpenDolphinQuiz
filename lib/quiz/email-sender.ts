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

// Quiz 询盘通知邮件发送器
//
// 功能:
// - 生成销售经理确认回复的 URL
// - 准备邮件负载(收件人/抄送/内容)
// - 通过 Resend 发送邮件给销售经理,抄送销售总监
//
// 调用链:
// 客户完成 Quiz → 生成项目编号 → 构建邮件内容 → 发送邮件给经理(抄送总监)

import React from "react";
import { sendEmail } from "@/lib/email";
import { InquiryNotificationEmail } from "@/emails/inquiry-notification-email";
import {
  buildInquiryEmailContent,
  renderInternalEmailFromTemplate,
  type InquiryEmailContent,
} from "./internal-email";
import type { QuizResult } from "./transform";

// 邮件发送参数
type SendInquiryEmailParams = {
  result: QuizResult;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  projectName: string;
  inquiryTime: Date;
  managerEmail: string | null;
  managerName: string | null;
  directorEmail: string | null;
  /** 报告模板中的内部告知邮件模板(subject/body),传入时实际发送与该模板一一对应(验收 2.1.7.4) */
  template?: { subject: string; body: string } | null;
};

// 邮件负载(测试用)
type InquiryEmailPayload = {
  to: string;
  cc: string[];
  content: InquiryEmailContent;
};

/**
 * 生成销售经理确认回复的 URL
 *
 * URL 格式:{APP_URL}/quiz/confirm?project={projectName}&token={uuid}
 * token 使用 crypto.randomUUID() 保证不可猜测
 *
 * @param projectName 项目编号(用于标识哪个询盘)
 * @returns 确认回复 URL
 */
export function generateConfirmUrl(projectName: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const token = crypto.randomUUID();
  const encodedProject = encodeURIComponent(projectName);
  return `${baseUrl}/quiz/confirm?project=${encodedProject}&token=${token}`;
}

/**
 * 准备邮件负载(纯函数,便于测试)
 *
 * @returns 包含收件人、抄送、邮件内容的负载
 */
export function prepareInquiryEmail(
  params: SendInquiryEmailParams
): InquiryEmailPayload {
  const {
    result,
    customerName,
    customerPhone,
    customerEmail,
    projectName,
    inquiryTime,
    managerEmail,
    managerName,
    directorEmail,
  } = params;

  // 生成确认 URL(仅当有经理邮箱时才生成,避免无效链接)
  const confirmUrl = managerEmail ? generateConfirmUrl(projectName) : null;

  const content = buildInquiryEmailContent({
    result,
    customerName,
    customerPhone,
    customerEmail,
    projectName,
    inquiryTime,
    managerName,
    managerEmail,
    confirmUrl,
  });

  return {
    to: managerEmail ?? "",
    cc: directorEmail ? [directorEmail] : [],
    content,
  };
}

/**
 * 发送询盘通知邮件
 *
 * 流程:
 * 1. 准备邮件负载(收件人/抄送/内容)
 * 2. 渲染邮件内容:
 *    - 传入 template 时,以报告模板的"内部告知邮件"为准渲染 HTML(验收 2.1.7.4)
 *    - 未传入 template 时,使用固定 React Email 组件(向后兼容)
 * 3. 通过 Resend 发送
 *
 * 异常处理:
 * - 销售经理邮箱为 null 时,不发送邮件,返回失败
 * - Resend API 错误时,捕获异常并返回失败
 *
 * @returns 发送结果 { success, error? }
 */
export async function sendInquiryNotificationEmail(
  params: SendInquiryEmailParams
): Promise<{ success: boolean; error?: string }> {
  const payload = prepareInquiryEmail(params);

  if (!payload.to) {
    return {
      success: false,
      error: "销售经理邮箱为空,无法发送询盘通知邮件",
    };
  }

  const emailElement = React.createElement(InquiryNotificationEmail, {
    content: payload.content,
  });

  // 以内部告知邮件模板为准渲染(与实际发送一一对应)
  const template = params.template;
  const rendered = template
    ? renderInternalEmailFromTemplate(
        template.subject,
        template.body,
        {
          projectName: params.projectName,
          customerName: params.customerName,
          theme: params.result.theme,
          customerPhone: params.customerPhone,
          customerEmail: params.customerEmail,
          inquiryTimeIso: params.inquiryTime.toISOString(),
          managerName: params.managerName,
          pathSummary: payload.content.pathSummary,
        },
        payload.content.confirmUrl
      )
    : null;

  const result = await sendEmail({
    to: payload.to,
    subject: rendered?.subject ?? payload.content.subject,
    ...(rendered ? { html: rendered.html } : { react: emailElement }),
    ...(payload.cc.length > 0 ? { cc: payload.cc } : {}),
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error instanceof Error ? result.error.message : "邮件发送失败",
    };
  }

  return { success: true };
}
