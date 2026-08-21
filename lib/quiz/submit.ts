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

// Quiz 询盘提交编排
//
// 功能(对应 AC-03):
// 1. 生成项目编号(客户名-询盘日期-询盘时间,唯一冲突时追加序号重试)
// 2. 写入 projects 表(数据库记录询盘时间)
// 3. 解析收件人(销售经理 + 抄送销售总监,测试期回退邮箱)
// 4. 发送询盘通知邮件(Resend)
//
// 设计说明:
// - 纯逻辑函数(buildProjectInsertData/resolveRecipients)与副作用(insertProjectWithRetry/submitQuizInquiry)
//   分离,便于单元测试
// - 依赖注入(insertProject/sendEmail)使测试无需真实 DB 与 Resend

import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import type { QuizResult } from "./transform";
import { generateProjectNumber, appendRetrySuffix } from "./project-number";
import { sendInquiryNotificationEmail } from "./email-sender";

// 项目编号唯一冲突重试上限
export const MAX_PROJECT_NUMBER_RETRIES = 5;

// 提交询盘的客户信息(手机号已解密)
export type QuizCustomer = {
  id: string;
  name: string;
  phone: string | null;
  email: string;
};

// 收件人(销售经理/总监)
export type QuizRecipient = {
  name: string;
  email: string;
};

// 提交询盘参数
export type SubmitQuizParams = {
  templateId: string;
  tenantId: string;
  customer: QuizCustomer;
  result: QuizResult;
  // 销售经理(由 result.managerId 查询得到)
  manager: QuizRecipient | null;
  // 销售总监(role = sales_director 的用户)
  director: QuizRecipient | null;
  // 测试期回退邮箱(RESEND_INTERNAL_TEST_EMAIL),经理缺失时使用
  fallbackEmail: string | null;
  // 内部告知邮件模板(subject/body),传入时实际发送邮件与其一一对应(验收 2.1.7.4)
  emailTemplate?: { subject: string; body: string } | null;
  inquiryTime?: Date;
};

// 提交结果
export type QuizSubmitOutcome = {
  projectNumber: string;
  emailSent: boolean;
  emailError: string | null;
};

// projects 插入数据结构
export type ProjectInsertData = {
  id: string;
  tenantId: string;
  userId: string;
  projectNumber: string;
  customerName: string;
  inquiryDate: string;
  inquiryTime: string;
  inquiryDatetime: Date;
  theme: string | null;
  phone: string | null;
  email: string;
  managerId: string | null;
};

/**
 * 判断是否为 Postgres 唯一约束冲突(错误码 23505)
 */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

/**
 * 将询盘时间拆分为 UTC 日期/时间字符串(与 inquiryDatetime 一致,UTC 存储)
 *
 * @returns 如 { inquiryDate: "2026-08-12", inquiryTime: "14:30:25" }
 */
function splitInquiryDatetime(date: Date): {
  inquiryDate: string;
  inquiryTime: string;
} {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return {
    inquiryDate: `${year}-${month}-${day}`,
    inquiryTime: `${hours}:${minutes}:${seconds}`,
  };
}

/**
 * 构建 projects 表插入数据(纯函数)
 */
export function buildProjectInsertData(
  params: SubmitQuizParams,
  inquiryTime: Date,
  projectNumber: string
): ProjectInsertData {
  const { inquiryDate, inquiryTime: inquiryTimeOfDay } = splitInquiryDatetime(
    inquiryTime
  );

  return {
    id: crypto.randomUUID(),
    tenantId: params.tenantId,
    userId: params.customer.id,
    projectNumber,
    customerName: params.customer.name,
    inquiryDate,
    inquiryTime: inquiryTimeOfDay,
    inquiryDatetime: inquiryTime,
    theme: params.result.theme,
    phone: params.customer.phone,
    email: params.customer.email,
    managerId: params.result.managerId,
  };
}

/**
 * 解析邮件收件人(纯函数)
 *
 * 规则:
 * - 收件人 = 销售经理邮箱;经理未配置时回退到测试邮箱(测试期可见性)
 * - 抄送 = 销售总监邮箱(未配置则无抄送)
 */
export function resolveRecipients(params: SubmitQuizParams): {
  managerEmail: string | null;
  managerName: string | null;
  directorEmail: string | null;
} {
  const managerEmail = params.manager?.email ?? params.fallbackEmail ?? null;
  const managerName =
    params.manager?.name ?? (params.fallbackEmail ? "内部测试" : null);

  return {
    managerEmail,
    managerName,
    directorEmail: params.director?.email ?? null,
  };
}

/**
 * 带唯一冲突重试的项目编号生成 + 插入
 *
 * 流程:
 * 1. 生成基础编号(客户名-询盘日期-询盘时间)
 * 2. 尝试插入 projects 表
 * 3. 唯一冲突时追加序号后缀(-1, -2, ...)重试,上限 MAX_PROJECT_NUMBER_RETRIES
 *
 * @param insertFn 插入函数(测试可注入 mock)
 * @returns 最终使用的项目编号
 */
export async function insertProjectWithRetry(
  insertFn: (data: ProjectInsertData) => Promise<void>,
  params: SubmitQuizParams,
  inquiryTime: Date
): Promise<string> {
  const baseNumber = generateProjectNumber(params.customer.name, inquiryTime);
  let projectNumber = baseNumber;

  for (let attempt = 0; ; attempt++) {
    try {
      await insertFn(buildProjectInsertData(params, inquiryTime, projectNumber));
      return projectNumber;
    } catch (error) {
      if (isUniqueViolation(error) && attempt < MAX_PROJECT_NUMBER_RETRIES) {
        projectNumber = appendRetrySuffix(baseNumber, attempt + 1);
        continue;
      }
      throw error;
    }
  }
}

/**
 * 提交询盘:生成编号 → 写入 DB → 发送通知邮件
 *
 * @returns 项目编号与邮件发送结果
 */
export async function submitQuizInquiry(
  params: SubmitQuizParams,
  deps: {
    insertProject?: (data: ProjectInsertData) => Promise<void>;
    sendEmail?: typeof sendInquiryNotificationEmail;
  } = {}
): Promise<QuizSubmitOutcome> {
  const inquiryTime = params.inquiryTime ?? new Date();
  const insertProject =
    deps.insertProject ??
    (async (data) => {
      await db.insert(projects).values(data);
    });
  const sendEmail = deps.sendEmail ?? sendInquiryNotificationEmail;

  // 1. 生成项目编号并写入 projects 表(记录询盘时间)
  const projectNumber = await insertProjectWithRetry(
    insertProject,
    params,
    inquiryTime
  );

  // 2. 解析收件人并发送邮件
  const recipients = resolveRecipients(params);
  const emailResult = await sendEmail({
    result: params.result,
    customerName: params.customer.name,
    customerPhone: params.customer.phone ?? "",
    customerEmail: params.customer.email,
    projectName: projectNumber,
    inquiryTime,
    managerEmail: recipients.managerEmail,
    managerName: recipients.managerName,
    directorEmail: recipients.directorEmail,
    template: params.emailTemplate,
  });

  return {
    projectNumber,
    emailSent: emailResult.success,
    emailError: emailResult.success ? null : (emailResult.error ?? "邮件发送失败"),
  };
}
