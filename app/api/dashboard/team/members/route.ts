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
import { requireTeamAccess, isSuperAdminEmail } from "@/lib/rbac";
import { getTeamMembersList, removeTeamMember } from "@/lib/teams";

export async function GET(request: NextRequest) {
  try {
    // 超级管理员可通过查询参数 teamId 指定任意团队
    const targetTeamId = request.nextUrl.searchParams.get("teamId") ?? undefined;
    const { user: actor, teamId } = await requireTeamAccess(targetTeamId);

    const members = await getTeamMembersList(teamId);

    // 操作者上下文:用于团队界面控制"移除成员"按钮的可用性
    const actorIsSuperAdmin = isSuperAdminEmail(actor.email);
    let actorIsTeamAdmin = false;
    if (!actorIsSuperAdmin) {
      actorIsTeamAdmin = members.some(
        (m) => m.id === actor.id && m.isTeamAdmin
      );
    }

    return NextResponse.json({
      members,
      actor: {
        id: actor.id,
        isSuperAdmin: actorIsSuperAdmin,
        isTeamAdmin: actorIsTeamAdmin,
      },
    });
  } catch (error) {
    console.error("team-members GET 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取团队成员失败" },
      { status: 500 }
    );
  }
}

/**
 * 移除团队正式成员
 *
 * 权限(服务端强制):
 * - 超级管理员(S-Admin):可随时移除任意正式成员,不受"满一周"限制、可移除团队管理员
 * - 团队管理员(T-Admin):仅可移除加入满一周的普通成员
 * - 前端隐藏按钮只是交互优化,最终以本端点校验为准
 */
export async function DELETE(request: NextRequest) {
  try {
    const targetTeamId = request.nextUrl.searchParams.get("teamId") ?? undefined;
    const body = await request.json();
    const { userId } = body as { userId?: string };
    if (!userId) {
      return NextResponse.json(
        { error: "缺少要移除的用户 ID" },
        { status: 400 }
      );
    }

    const { user: actor, teamId } = await requireTeamAccess(targetTeamId);
    if (!teamId) {
      return NextResponse.json(
        { error: "缺少团队 ID" },
        { status: 400 }
      );
    }

    const actorIsSuperAdmin = isSuperAdminEmail(actor.email);
    await removeTeamMember({
      teamId,
      actorUserId: actor.id,
      actorIsSuperAdmin,
      targetUserId: userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("team-members DELETE 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "移除成员失败" },
      { status: 500 }
    );
  }
}
