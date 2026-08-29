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
import { user, ACCOUNT_TYPES } from "@/lib/db/schema";
import { decrypt, isEncryptionEnabled } from "@/lib/crypto";
import {
  submitQuizInquiry,
  type QuizRecipient,
} from "@/lib/quiz/submit";
import {
  getInquiryLimitStatusForTenant,
  maybeSendInquiryLimitEmails,
} from "@/lib/dashboard/inquiry-limit";
import { getPotentialCustomerLimitStatusForTenant, getPlanLimits } from "@/lib/plan-limits";
import { getEmailTemplatesByTenant } from "@/lib/dashboard/email-templates";
import { EMAIL_TEMPLATE_TYPES } from "@/lib/db/schema";
import { getTemplateTenantId } from "@/lib/quiz/queries";
import {
  joinTeamAsCustomer,
  getTeamPlan,
  getTeamAdminEmail,
} from "@/lib/teams";

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

// 查询团队销售总监(用于抄送,is_director 标记,兼容 role = sales_director)
async function findSalesDirector(teamId: string): Promise<QuizRecipient | null> {
  const { getSalesDirector } = await import("@/lib/dashboard/team");
  const director = await getSalesDirector(teamId);
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
        { error: "Please register before submitting an inquiry" },
        { status: 401 }
      );
    }

    // 2. 校验请求体
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const parsed = quizSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Submission data validation failed",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    // 3. 查询客户信息(姓名/邮箱/加密手机号/账号类型)
    const userRows = await db
      .select({
        name: user.name,
        email: user.email,
        phone: user.phone,
        accountType: user.accountType,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);
    const targetUser = userRows[0];
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // 3.1 询盘归属团队:按问卷模板所属团队(tenant_id = team.id)归属,
    // 而非提交者本人,保证团队仪表盘可见全部客户询盘
    const teamId = await getTemplateTenantId(parsed.data.templateId);
    if (!teamId) {
      return NextResponse.json({ error: "Quiz template not found" }, { status: 404 });
    }

    // 3.2 客户自动归属该团队(客户可属于多个团队;团队成员自测问卷不受影响)
    if (targetUser.accountType === ACCOUNT_TYPES.CUSTOMER) {
      await joinTeamAsCustomer(session.user.id, teamId);
    }

    // 3.3 询盘次数限制检查(按团队套餐:Free 5 次/天硬上限;Pro/Max 无每日询盘限制)
    const teamPlan = await getTeamPlan(teamId);
    const limitStatus = await getInquiryLimitStatusForTenant(
      teamId,
      getPlanLimits(teamPlan).dailyInquiryLimit
    );
    if (limitStatus.isLimited) {
      return NextResponse.json(
        { error: "Today's inquiry limit has been reached, please try again tomorrow" },
        { status: 403 }
      );
    }

    // 3.4 潜在客户配额检查(按团队套餐计算:Free 30个/月,Pro 10000个/年,Max 30000个/年)
    const customerLimit = await getPotentialCustomerLimitStatusForTenant(
      teamId,
      teamPlan
    );
    if (customerLimit.isLimited) {
      const periodLabel =
        customerLimit.period === "year" ? "this year" : "this month";
      return NextResponse.json(
        {
          error: `Your current plan's potential customer limit has been reached (${periodLabel} maximum ${customerLimit.limit}). Please contact your service provider to upgrade your plan.`,
        },
        { status: 403 }
      );
    }

    // 4. 解析销售经理与销售总监(均在问卷所属团队内)
    const manager = parsed.data.result.managerId
      ? await findUserById(parsed.data.result.managerId)
      : null;
    const director = await findSalesDirector(teamId);

    // 4.1 读取团队内部告知邮件模板(实际发送邮件与其一一对应,验收 2.1.7.4)
    const tenantTemplates = await getEmailTemplatesByTenant(teamId);
    const internalTemplate = tenantTemplates[EMAIL_TEMPLATE_TYPES.INTERNAL];

    // 5. 提交询盘(生成编号 + 入库 + 发邮件,归属团队)
    const outcome = await submitQuizInquiry({
      templateId: parsed.data.templateId,
      tenantId: teamId,
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

    // 5.1 提交后按团队检查询盘次数,触发提示邮件(发给团队管理员,>=3 次提示,>=5 次再提示)
    const teamAdminEmail = await getTeamAdminEmail(teamId);
    if (teamAdminEmail) {
      await maybeSendInquiryLimitEmails(teamId, teamAdminEmail);
    }

    return NextResponse.json({ success: true, ...outcome });
  } catch (error) {
    // 边界层统一异常处理:记录完整上下文
    console.error("quiz submit error:", error);
    return NextResponse.json(
      { error: "Failed to submit inquiry, please try again" },
      { status: 500 }
    );
  }
}
