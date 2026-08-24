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

// 参考模板应用 API
//
// POST /api/dashboard/template/apply-reference
// 权限:团队成员
//
// 请求体:
// - { action: "apply", referenceId: "教育培训模板id" }  应用共享参考模板
// - { action: "clear" }                                 清空当前模板问卷内容(新建问卷)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTeamAccess } from "@/lib/rbac";
import { getActiveClientTemplate } from "@/lib/quiz/queries";
import { createDefaultQuizTemplate } from "@/lib/quiz/template-init";
import { findReferenceTemplate } from "@/lib/reference-templates";
import {
  applyReferenceTemplate,
  clearTemplateContent,
} from "@/lib/dashboard/reference-apply";

const applyReferenceSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("apply"),
    referenceId: z.string().min(1, "缺少参考模板 ID"),
  }),
  z.object({
    action: z.literal("clear"),
  }),
]);

export async function POST(request: NextRequest) {
  try {
    // 团队隔离:仅可操作当前团队激活模板
    const { teamId } = await requireTeamAccess();

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
    }

    const parsed = applyReferenceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "请求参数校验失败", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // 获取当前团队激活模板(不存在时创建默认模板)
    let template = await getActiveClientTemplate(teamId);
    if (!template) {
      await createDefaultQuizTemplate(teamId, { status: "active" });
      template = await getActiveClientTemplate(teamId);
    }
    if (!template) {
      return NextResponse.json(
        { error: "当前没有激活的 Quiz 模板" },
        { status: 404 }
      );
    }

    const { action } = parsed.data;

    if (action === "clear") {
      await clearTemplateContent(template.id);
      return NextResponse.json({
        success: true,
        message: "问卷内容已清空,请重新输入",
      });
    }

    // action === "apply"
    const ref = findReferenceTemplate(parsed.data.referenceId);
    if (!ref) {
      return NextResponse.json(
        { error: "参考模板不存在" },
        { status: 404 }
      );
    }

    await applyReferenceTemplate(template.id, ref);

    return NextResponse.json({
      success: true,
      message: `已应用参考模板「${ref.name}」`,
      styleId: ref.styleId,
    });
  } catch (error) {
    console.error("apply-reference 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "应用参考模板失败" },
      { status: 500 }
    );
  }
}