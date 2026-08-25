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

// 项目查看授权 API
//
// POST:   管理员授权销售经理查看某个非自己跟踪的项目 { projectId, managerId }
// DELETE: 管理员撤销对该销售经理的项目查看授权 { projectId, managerId }
//
// 权限:仅团队管理员(团队创建者)可授权/撤销;
// 授权对象必须是本团队销售经理(role = sales_manager)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTeamAccess } from "@/lib/rbac";
import {
  grantProjectAccess,
  revokeProjectAccess,
  isTeamAdminViewer,
} from "@/lib/dashboard/project-permissions";

const accessSchema = z.object({
  projectId: z.string().min(1),
  managerId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = accessSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数错误:缺少 projectId 或 managerId" },
        { status: 400 }
      );
    }

    const { teamId, user } = await requireTeamAccess();
    // 仅团队管理员可授权(团队创建者)
    if (!isTeamAdminViewer(teamId, { id: user.id, role: user.role, isDirector: user.isDirector, email: user.email })) {
      return NextResponse.json(
        { error: "仅管理员可授权查看项目" },
        { status: 403 }
      );
    }

    await grantProjectAccess(
      teamId,
      parsed.data.projectId,
      parsed.data.managerId,
      user.id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "授权失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = accessSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数错误:缺少 projectId 或 managerId" },
        { status: 400 }
      );
    }

    const { teamId, user } = await requireTeamAccess();
    if (!isTeamAdminViewer(teamId, { id: user.id, role: user.role, isDirector: user.isDirector, email: user.email })) {
      return NextResponse.json(
        { error: "仅管理员可撤销查看授权" },
        { status: 403 }
      );
    }

    await revokeProjectAccess(
      teamId,
      parsed.data.projectId,
      parsed.data.managerId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "撤销授权失败" },
      { status: 500 }
    );
  }
}
