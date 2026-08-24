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

// Dashboard 团队管理 API(Phase 3 Task 3.5 + 验收修订)
//
// GET: 销售经理列表 + 销售总监 + 模板主题 + 各经理负责的主题
// POST: 添加销售经理(将已注册用户提升为经理)
// DELETE: 删除销售经理(恢复普通用户,query 参数 userId)
// 权限:管理员/销售总监/销售经理可访问 Dashboard

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTeamAccess } from "@/lib/rbac";
import { getActiveClientTemplate } from "@/lib/quiz/queries";
import {
  listSalesManagers,
  addSalesManager,
  removeSalesManager,
  getSalesDirector,
  listTemplateThemes,
  getManagerThemes,
} from "@/lib/dashboard/team";

const addManagerSchema = z.object({
  email: z.string().email("请输入有效邮箱").trim().toLowerCase(),
});

export async function GET(request: NextRequest) {
  try {
    // 超级管理员可通过查询参数 teamId 指定任意团队
    const targetTeamId = request.nextUrl.searchParams.get("teamId") ?? undefined;
    const { teamId } = await requireTeamAccess(targetTeamId);

    const managers = await listSalesManagers(teamId);
    const director = await getSalesDirector(teamId);

    // 获取激活模板,用于主题关联数据
    const clientTemplate = await getActiveClientTemplate(teamId);
    let themes: string[] = [];
    let managerThemes: Record<string, string[]> = {};
    if (clientTemplate) {
      themes = await listTemplateThemes(clientTemplate.id);
      const themeResults = await Promise.all(
        managers.map(async (m) => ({
          managerId: m.id,
          themes: await getManagerThemes(m.id, clientTemplate.id),
        }))
      );
      managerThemes = Object.fromEntries(
        themeResults.map((r) => [r.managerId, r.themes])
      );
    }

    return NextResponse.json({ managers, director, themes, managerThemes });
  } catch (error) {
    console.error("team GET 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取团队失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const targetTeamId = request.nextUrl.searchParams.get("teamId") ?? undefined;
    const { teamId } = await requireTeamAccess(targetTeamId);

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
    }

    const parsed = addManagerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "邮箱格式不正确", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const manager = await addSalesManager(parsed.data.email, teamId);
    return NextResponse.json({ success: true, manager });
  } catch (error) {
    console.error("team POST 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "添加销售经理失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const targetTeamId = request.nextUrl.searchParams.get("teamId") ?? undefined;
    const { teamId } = await requireTeamAccess(targetTeamId);

    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "缺少 userId 参数" },
        { status: 400 }
      );
    }

    await removeSalesManager(userId, teamId);
    return NextResponse.json({ success: true, message: "销售经理已移除" });
  } catch (error) {
    console.error("team DELETE 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "移除销售经理失败" },
      { status: 500 }
    );
  }
}
