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

// Dashboard 销售经理主题更新 API(Phase 3 验收修订 2.1.7.5)
//
// PUT: 更新销售经理负责的主题集合(经理可负责多个主题)
// 权限:管理员/销售总监/销售经理可访问 Dashboard

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTeamAccess } from "@/lib/rbac";
import { getActiveClientTemplate } from "@/lib/quiz/queries";
import { updateManagerThemes } from "@/lib/dashboard/team";

const updateThemesSchema = z.object({
  managerId: z.string().min(1, "缺少经理 ID"),
  themes: z.array(z.string()).default([]),
});

export async function PUT(request: NextRequest) {
  try {
    const { teamId } = await requireTeamAccess();

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
    }

    const parsed = updateThemesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数校验失败", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // 获取当前租户(团队)激活模板(主题关联基于模板 P3 选项)
    const clientTemplate = await getActiveClientTemplate(teamId);
    if (!clientTemplate) {
      return NextResponse.json(
        { error: "当前没有激活的 Quiz 模板" },
        { status: 404 }
      );
    }

    await updateManagerThemes(
      parsed.data.managerId,
      clientTemplate.id,
      parsed.data.themes
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("team themes PUT 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新主题失败" },
      { status: 500 }
    );
  }
}
