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

// Dashboard 预警设置 API(Phase 3 Task 3.6)
//
// GET: 获取当前租户预警设置(黄色/红色阈值小时数)
// PUT: 更新预警设置
// 权限:管理员/销售总监/销售经理可访问 Dashboard

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireTeamAccess } from "@/lib/rbac";
import {
  getWarningSettingsByTenant,
  updateWarningSettingsByTenant,
} from "@/lib/dashboard/warning-settings";

const putSettingsSchema = z.object({
  yellowHours: z.number().int().min(1),
  redHours: z.number().int().min(2),
});

export async function GET() {
  try {
    const { teamId } = await requireTeamAccess();
    const settings = await getWarningSettingsByTenant(teamId);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("warning-settings GET 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load warning settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { teamId } = await requireTeamAccess();

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = putSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Warning settings validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await updateWarningSettingsByTenant(
      teamId,
      parsed.data.yellowHours,
      parsed.data.redHours
    );

    return NextResponse.json({ success: true, message: "Warning settings saved" });
  } catch (error) {
    console.error("warning-settings PUT 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save warning settings" },
      { status: 500 }
    );
  }
}
