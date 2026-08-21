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
import { requireDashboardAccess } from "@/lib/rbac";
import { updateUserPhone } from "@/lib/dashboard/team";

const updatePhoneSchema = z.object({
  userId: z.string().min(1, "缺少用户 ID"),
  phone: z.string().trim(),
});

export async function PUT(request: NextRequest) {
  try {
    await requireDashboardAccess();

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
    }

    const parsed = updatePhoneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数校验失败", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await updateUserPhone(parsed.data.userId, parsed.data.phone);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("team phone PUT 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新电话失败" },
      { status: 500 }
    );
  }
}
