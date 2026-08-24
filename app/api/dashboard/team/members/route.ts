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

// Dashboard 团队成员列表 API
//
// GET: 获取当前用户所在团队的成员列表
// 权限:团队成员可访问(客户已在 requireTeamAccess 拦截)
// 数据隔离:仅返回当前用户所在团队的成员信息
// 超级管理员:可通过查询参数 teamId 指定任意团队

import { NextRequest, NextResponse } from "next/server";
import { requireTeamAccess } from "@/lib/rbac";
import { getTeamMembersList } from "@/lib/teams";

export async function GET(request: NextRequest) {
  try {
    // 超级管理员可通过查询参数 teamId 指定任意团队
    const targetTeamId = request.nextUrl.searchParams.get("teamId") ?? undefined;
    const { teamId } = await requireTeamAccess(targetTeamId);

    const members = await getTeamMembersList(teamId);

    return NextResponse.json({ members });
  } catch (error) {
    console.error("team-members GET 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取团队成员失败" },
      { status: 500 }
    );
  }
}
