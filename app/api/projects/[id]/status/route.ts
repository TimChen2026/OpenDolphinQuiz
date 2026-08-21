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

// 项目状态流转 API(Phase 3 Task 3.8)
//
// PATCH: 更新项目状态(跟进 → 失单/获单,失单可回跟进)
// 权限:管理员/销售总监/销售经理可访问 Dashboard
// 说明:需求 2.2.3.14 由销售总监在 review 时手动修改

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireDashboardAccess } from "@/lib/rbac";
import { updateProjectStatus } from "@/lib/dashboard/project-status";
import { PROJECT_STATUS } from "@/lib/db/schema";

const patchStatusSchema = z.object({
  status: z.enum([
    PROJECT_STATUS.FOLLOW_UP,
    PROJECT_STATUS.WON,
    PROJECT_STATUS.LOST,
  ]),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // requireDashboardAccess 可能调用 redirect() 抛出 NEXT_REDIRECT,
  // 必须放在 try-catch 外,否则 redirect 异常会被 catch 吞掉,导致状态更新失败
  const user = await requireDashboardAccess();

  try {
    const { id } = await context.params;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
    }

    const parsed = patchStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "状态参数非法", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await updateProjectStatus(id, user.id, parsed.data.status);

    return NextResponse.json({ success: true, status: parsed.data.status });
  } catch (error) {
    console.error("project status 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新项目状态失败" },
      { status: 500 }
    );
  }
}
