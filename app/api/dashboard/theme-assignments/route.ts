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

// Dashboard 主题-经理关联 API(Phase 3 Task 3.6 内部告知邮件设置)
//
// GET: 获取当前租户模板的主题-经理关联列表
// PUT: 更新指定主题的销售经理
// 权限:管理员/销售总监/销售经理可访问 Dashboard

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireDashboardAccess } from "@/lib/rbac";
import { getActiveClientTemplate } from "@/lib/quiz/queries";
import {
  getThemeAssignments,
  updateThemeManager,
  listSalesManagers,
} from "@/lib/dashboard/team";

const putAssignmentSchema = z.object({
  theme: z.string().min(1),
  managerId: z.string().nullable(),
});

export async function GET() {
  try {
    const user = await requireDashboardAccess();

    const template = await getActiveClientTemplate(user.id);
    if (!template) {
      return NextResponse.json(
        { error: "当前没有激活的 Quiz 模板" },
        { status: 404 }
      );
    }

    const [assignments, managers] = await Promise.all([
      getThemeAssignments(template.id),
      listSalesManagers(),
    ]);

    return NextResponse.json({ assignments, managers, templateId: template.id });
  } catch (error) {
    console.error("theme-assignments GET 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取主题关联失败" },
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

    const parsed = putAssignmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "关联数据校验失败", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const template = await getActiveClientTemplate(user.id);
    if (!template) {
      return NextResponse.json(
        { error: "当前没有激活的 Quiz 模板" },
        { status: 404 }
      );
    }

    await updateThemeManager(template.id, parsed.data.theme, parsed.data.managerId);

    return NextResponse.json({ success: true, message: "主题负责人已更新" });
  } catch (error) {
    console.error("theme-assignments PUT 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新主题负责人失败" },
      { status: 500 }
    );
  }
}
