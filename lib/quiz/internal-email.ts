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

// Quiz 询盘通知邮件(Internal Email)内容生成器
//
// 用途:客户完成 Quiz 后,生成发送给销售经理的内部通知邮件内容
// 收件人:销售经理(关联到 P3 选项的 result_manager_id)
// 抄送:销售总监
//
// 邮件内容包含:
// - 客户信息(姓名/电话/邮箱)
// - 项目编号(客户名-询盘日期-询盘时间)
// - 询盘时间(UTC)
// - 关联主题
// - Quiz 选择路径摘要(P1→P2→P3)
// - 销售经理信息
// - 确认回复链接(用于 Task 2.7 销售经理确认回复功能)

import type { QuizPathEntry, QuizResult } from "./transform";

// 邮件内容数据结构
export type InquiryEmailContent = {
  // 客户信息
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  // 项目信息
  projectName: string;
  inquiryTimeIso: string; // UTC ISO 字符串,便于跨时区处理
  theme: string | null;
  // 销售经理信息
  managerName: string | null;
  managerEmail: string | null;
  // 确认回复链接(销售经理点击确认收到询盘)
  confirmUrl: string | null;
  // 格式化的 Quiz 路径摘要
  pathSummary: string;
  // 邮件主题
  subject: string;
};

// 邮件主题生成参数
type EmailSubjectParams = {
  projectName: string;
  theme: string | null;
};

// 邮件内容生成参数
type BuildInquiryEmailContentParams = {
  result: QuizResult;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  projectName: string;
  inquiryTime: Date;
  managerName: string | null;
  managerEmail: string | null;
  confirmUrl: string | null;
};

/**
 * 生成邮件主题
 *
 * 格式:[New Inquiry] {项目编号} - {主题}
 * 主题为 null 时:[New Inquiry] {项目编号}
 */
export function buildEmailSubject({
  projectName,
  theme,
}: EmailSubjectParams): string {
  if (theme) {
    return `[New Inquiry] ${projectName} - ${theme}`;
  }
  return `[New Inquiry] ${projectName}`;
}

/**
 * 将 Quiz 路径格式化为可读的文本摘要
 *
 * 每行格式:[P层级] 问题 → 选项标签:选项文本
 * 示例:[P1] 您孩子的年龄段是? → A:6-9 岁
 */
export function formatPathSummary(path: QuizPathEntry[]): string {
  return path
    .map((entry) => {
      return `[${entry.nodeLevel}] ${entry.nodeQuestion} → ${entry.optionLabel}:${entry.optionText}`;
    })
    .join("\n");
}

/**
 * 构建完整的 Internal Email 内容
 *
 * @param params 包含 Quiz 结果、客户信息、项目编号、销售经理信息等
 * @returns 邮件内容数据结构(含主题、路径摘要等)
 */
export function buildInquiryEmailContent(
  params: BuildInquiryEmailContentParams
): InquiryEmailContent {
  const {
    result,
    customerName,
    customerPhone,
    customerEmail,
    projectName,
    inquiryTime,
    managerName,
    managerEmail,
    confirmUrl,
  } = params;

  const subject = buildEmailSubject({
    projectName,
    theme: result.theme,
  });

  const pathSummary = formatPathSummary(result.path);

  return {
    customerName,
    customerPhone,
    customerEmail,
    projectName,
    inquiryTimeIso: inquiryTime.toISOString(),
    theme: result.theme,
    managerName,
    managerEmail,
    confirmUrl,
    pathSummary,
    subject,
  };
}

// ==================== 模板渲染(内部告知邮件与实际发送一一对应) ====================

// 模板渲染变量
export type EmailTemplateVars = {
  projectName: string;
  customerName: string;
  theme: string | null;
  customerPhone: string;
  customerEmail: string;
  inquiryTimeIso: string;
  managerName: string | null;
  pathSummary: string;
  /** @持续时间(小时),预警邮件使用,不适用时留空 */
  durationHours?: string | number;
  /** @今日询盘次数,询盘上限提醒邮件使用,不适用时留空 */
  inquiryCount?: string | number;
  /** @定价页链接,询盘上限提醒邮件使用,不适用时留空 */
  pricingUrl?: string;
  teamName?: string;
};

/**
 * 替换模板中的 @变量 占位符
 *
 * 支持的变量(与 Dashboard 报告模板页可用变量一致,全部英文驼峰 token):
 * @ProjectNo / @CustomerName / @Topic / @CustomerPhone / @CustomerEmail /
 * @InquiryTime / @Duration / @SalesManager / @SelectedPath /
 * @TodayInquiryCount / @PricingLink(另有 @Team 团队名)
 */
export function renderTemplateVars(
  text: string,
  vars: EmailTemplateVars
): string {
  const pricingUrl =
    vars.pricingUrl ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/pricing`;

  const replacements: Record<string, string> = {
    ProjectNo: vars.projectName,
    CustomerName: vars.customerName,
    Topic: vars.theme ?? "",
    CustomerPhone: vars.customerPhone,
    CustomerEmail: vars.customerEmail,
    InquiryTime: vars.inquiryTimeIso,
    Duration: vars.durationHours != null ? String(vars.durationHours) : "",
    SalesManager: vars.managerName ?? "",
    SelectedPath: vars.pathSummary,
    TodayInquiryCount: vars.inquiryCount != null ? String(vars.inquiryCount) : "",
    PricingLink: pricingUrl,
    Team: vars.teamName ?? "DolphinQuiz",
  };

  let result = text;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.split(`@${key}`).join(value);
  }
  return result;
}

/**
 * 按模板渲染内部告知邮件(HTML)
 *
 * 验收要求(2.1.7.4):以报告模板中"内部告知邮件"模板为准,实际发送的邮件与其一一对应。
 * 发送时读取模板 subject/body,替换 @变量 后转 HTML,并追加确认回复按钮。
 *
 * @param subjectTemplate 模板主题(含 @变量)
 * @param bodyTemplate 模板正文(含 @变量)
 * @param vars 渲染变量
 * @param confirmUrl 销售经理确认回复链接(可选)
 * @returns { subject, html } 邮件主题与 HTML 正文
 */
export function renderInternalEmailFromTemplate(
  subjectTemplate: string,
  bodyTemplate: string,
  vars: EmailTemplateVars,
  confirmUrl: string | null
): { subject: string; html: string } {
  const subject = renderTemplateVars(subjectTemplate, vars);
  // 正文先做 @变量 替换,再转义 HTML 特殊字符后保留换行,防止模板注入
  const renderedBody = renderTemplateVars(bodyTemplate, vars);
  const escapedBody = renderedBody
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const bodyHtml = escapedBody.split("\n").join("<br/>");

  const confirmButton = confirmUrl
    ? `<p style="margin:24px 0;text-align:center;">
        <a href="${confirmUrl}" style="display:inline-block;background-color:#000;color:#fff;border-radius:6px;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;">
          Confirm receipt of inquiry
        </a>
      </p>
      <p style="color:#898989;font-size:12px;line-height:20px;margin:10px 0 0;text-align:center;">
        Click the button above to confirm you have received this inquiry; the system will record your confirmation time.
      </p>`
    : "";

  return {
    subject,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:20px 0 48px;">
        <h1 style="color:#333;font-size:24px;font-weight:600;line-height:40px;margin:0 0 20px;">${subject}</h1>
        <div style="color:#333;font-size:14px;line-height:24px;margin:0 0 10px;">${bodyHtml}</div>
        ${confirmButton}
        <hr style="border-color:#e6e6e6;margin:20px 0;" />
        <p style="color:#898989;font-size:12px;line-height:20px;margin:10px 0 0;">
          This email was sent automatically by DolphinQuiz. Please do not reply to this email.
        </p>
      </div>
    `,
  };
}
