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

// Dashboard 报告模板 API(Phase 3 Task 3.4)
//
// GET: 获取当前租户全部邮件模板(报告/Summary/Internal/预警等)
// PUT: 保存单个模板(subject/body)
// 权限:管理员/销售总监/销售经理可访问 Dashboard

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireDashboardAccess } from "@/lib/rbac";
import {
  getEmailTemplatesByTenant,
  upsertEmailTemplate,
  getDefaultTemplate,
} from "@/lib/dashboard/email-templates";

const putTemplateSchema = z.object({
  templateType: z.string().min(1),
  subject: z.string().min(1, "邮件主题不能为空"),
  body: z.string().min(1, "邮件正文不能为空"),
});

export async function GET() {
  try {
    const user = await requireDashboardAccess();
    const templates = await getEmailTemplatesByTenant(user.id);
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("email-templates GET 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取模板失败" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireDashboardAccess();

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
    }

    const parsed = putTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "模板数据校验失败", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const defaultTemplate = getDefaultTemplate(parsed.data.templateType);
    await upsertEmailTemplate(user.id, {
      templateType: parsed.data.templateType,
      name: defaultTemplate?.name ?? parsed.data.templateType,
      subject: parsed.data.subject,
      body: parsed.data.body,
    });

    return NextResponse.json({ success: true, message: "模板已保存" });
  } catch (error) {
    console.error("email-templates PUT 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存模板失败" },
      { status: 500 }
    );
  }
}
