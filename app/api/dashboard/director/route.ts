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

// Dashboard 销售总监设置 API(Phase 3 验收修订 2.1.7.5/2.1.8.1)
//
// PUT: 设置销售总监(将指定用户提升为总监,原有总监降为普通用户)
// 权限:管理员/销售总监/销售经理可访问 Dashboard

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireDashboardAccess } from "@/lib/rbac";
import { setSalesDirector } from "@/lib/dashboard/team";

const setDirectorSchema = z.object({
  userId: z.string().min(1, "缺少用户 ID"),
});

export async function PUT(request: NextRequest) {
  try {
    await requireDashboardAccess();

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
    }

    const parsed = setDirectorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数校验失败", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const director = await setSalesDirector(parsed.data.userId);
    return NextResponse.json({ success: true, director });
  } catch (error) {
    console.error("director PUT 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "设置销售总监失败" },
      { status: 500 }
    );
  }
}
