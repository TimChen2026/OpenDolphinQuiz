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

// Dashboard 模板编辑保存 API(Phase 3 Task 3.3)
//
// POST: 批量保存 Quiz 模板编辑(节点问题 + 选项文本/跳转/主题/经理)
// 权限:管理员/销售总监/销售经理可访问 Dashboard

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTeamAccess } from "@/lib/rbac";
import { getTemplateTenantId } from "@/lib/quiz/queries";
import { saveTemplateEdits } from "@/lib/dashboard/quiz-editor";

// 请求体校验
const nodeSaveSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1, "Question is required"),
});

const optionSaveSchema = z.object({
  id: z.string().min(1),
  optionText: z.string().min(1, "Option text is required"),
  targetNodeId: z.string().nullable(),
  resultTheme: z.string().nullable(),
  resultManagerId: z.string().nullable(),
});

const saveTemplateSchema = z.object({
  templateId: z.string().min(1),
  nodes: z.array(nodeSaveSchema),
  options: z.array(optionSaveSchema),
});

export async function POST(request: NextRequest) {
  try {
    const { teamId } = await requireTeamAccess();

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = saveTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Save data validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { templateId, nodes, options } = parsed.data;

    // 模板归属校验:仅可保存本团队(租户)的模板,防止跨团队越权修改
    const templateTenantId = await getTemplateTenantId(templateId);
    if (templateTenantId !== teamId) {
      return NextResponse.json(
        { error: "You are not allowed to modify this template" },
        { status: 403 }
      );
    }

    await saveTemplateEdits(templateId, nodes, options);

    return NextResponse.json({ success: true, message: "Template saved" });
  } catch (error) {
    console.error("template save 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save template" },
      { status: 500 }
    );
  }
}
