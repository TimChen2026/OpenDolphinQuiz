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

// Dashboard 销售经理/总监电话更新 API(Phase 3 验收修订 2.1.7.5)
//
// PUT: 更新指定销售经理/总监的电话(加密存储)
// 权限:管理员/销售总监/销售经理可访问 Dashboard

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTeamAccess } from "@/lib/rbac";
import { updateUserPhone } from "@/lib/dashboard/team";
import { assertTeamStaff } from "@/lib/teams";

const updatePhoneSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  phone: z.string().trim(),
});

export async function PUT(request: NextRequest) {
  try {
    const { teamId } = await requireTeamAccess();

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = updatePhoneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // 仅可更新本团队成员的电话(团队隔离)
    await assertTeamStaff(parsed.data.userId, teamId);
    await updateUserPhone(parsed.data.userId, parsed.data.phone);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("team phone PUT 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update phone" },
      { status: 500 }
    );
  }
}
