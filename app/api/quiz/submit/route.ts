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

// Quiz 询盘提交 API
//
// 功能(AC-03):客户点击"返回开始"后调用
// 1. 校验登录(客户须先注册 - Task 2.8)
// 2. 生成项目编号 + 写入 projects 表(记录询盘时间,唯一约束保证不重复)
// 3. 解析销售经理/销售总监邮箱(经理缺失时回退测试邮箱)
// 4. 发送询盘通知邮件(发销售经理,抄送销售总监)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { decrypt, isEncryptionEnabled } from "@/lib/crypto";
import {
  submitQuizInquiry,
  type QuizRecipient,
} from "@/lib/quiz/submit";
import {
  getInquiryLimitStatusForTenant,
  maybeSendInquiryLimitEmails,
} from "@/lib/dashboard/inquiry-limit";
import { getEmailTemplatesByTenant } from "@/lib/dashboard/email-templates";
import { EMAIL_TEMPLATE_TYPES } from "@/lib/db/schema";

// ==================== 请求体校验 ====================

const pathEntrySchema = z.object({
  nodeId: z.string().min(1),
  nodeLevel: z.enum(["P1", "P2", "P3"]),
  nodeQuestion: z.string().min(1),
  optionId: z.string().min(1),
  optionLabel: z.enum(["A", "B", "C", "D"]),
  optionText: z.string().min(1),
});

const quizSubmitSchema = z.object({
  templateId: z.string().min(1),
  result: z.object({
    theme: z.string().nullable(),
    managerId: z.string().nullable(),
    path: z.array(pathEntrySchema).min(1),
  }),
});

// ==================== 收件人查询 ====================

// 按用户 ID 查询销售经理
async function findUserById(userId: string): Promise<QuizRecipient | null> {
  const rows = await db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return rows[0] ?? null;
}

// 查询系统内销售总监(用于抄送,is_director 标记,兼容 role = sales_director)
async function findSalesDirector(): Promise<QuizRecipient | null> {
  const { getSalesDirector } = await import("@/lib/dashboard/team");
  const director = await getSalesDirector();
  return director ? { name: director.name, email: director.email } : null;
}

// 解密手机号,失败或未配置密钥时返回 null(不阻塞询盘提交)
function safeDecryptPhone(encryptedPhone: string | null): string | null {
  if (!encryptedPhone || !isEncryptionEnabled()) {
    return null;
  }
  try {
    return decrypt(encryptedPhone);
  } catch {
    return null;
  }
}

// ==================== 主处理 ====================

export async function POST(request: NextRequest) {
  try {
    // 1. 校验登录(注册后关联 Quiz 结果 - Task 2.8)
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json(
        { error: "请先注册后再提交询盘" },
        { status: 401 }
      );
    }

    // 2. 校验请求体
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "请求体格式错误" },
        { status: 400 }
      );
    }
    const parsed = quizSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "提交数据校验失败",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    // 3. 查询客户信息(姓名/邮箱/加密手机号)
    const userRows = await db
      .select({ name: user.name, email: user.email, phone: user.phone })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);
    const targetUser = userRows[0];
    if (!targetUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 401 });
    }

    // 3.1 询盘次数限制检查(AC-06:免费套餐 5 次/天硬上限)
    const limitStatus = await getInquiryLimitStatusForTenant(session.user.id);
    if (limitStatus.isLimited) {
      return NextResponse.json(
        { error: "今日询盘次数已达上限,请明日再试" },
        { status: 403 }
      );
    }

    // 4. 解析销售经理与销售总监
    const manager = parsed.data.result.managerId
      ? await findUserById(parsed.data.result.managerId)
      : null;
    const director = await findSalesDirector();

    // 4.1 读取内部告知邮件模板(实际发送邮件与其一一对应,验收 2.1.7.4)
    const tenantTemplates = await getEmailTemplatesByTenant(session.user.id);
    const internalTemplate = tenantTemplates[EMAIL_TEMPLATE_TYPES.INTERNAL];

    // 5. 提交询盘(生成编号 + 入库 + 发邮件)
    const outcome = await submitQuizInquiry({
      templateId: parsed.data.templateId,
      tenantId: session.user.id,
      customer: {
        id: session.user.id,
        name: targetUser.name,
        phone: safeDecryptPhone(targetUser.phone),
        email: targetUser.email,
      },
      result: parsed.data.result,
      manager,
      director,
      // 测试期回退邮箱:未配置销售经理时发到该邮箱,保证邮件可见
      fallbackEmail: process.env.RESEND_INTERNAL_TEST_EMAIL ?? null,
      emailTemplate: internalTemplate
        ? { subject: internalTemplate.subject, body: internalTemplate.body }
        : null,
    });

    // 5.1 提交后检查询盘次数,触发提示邮件(>=3 次提示,>=5 次再提示)
    await maybeSendInquiryLimitEmails(session.user.id, targetUser.email);

    return NextResponse.json({ success: true, ...outcome });
  } catch (error) {
    // 边界层统一异常处理:记录完整上下文
    console.error("quiz submit 错误:", error);
    return NextResponse.json(
      { error: "询盘提交失败,请重试" },
      { status: 500 }
    );
  }
}
