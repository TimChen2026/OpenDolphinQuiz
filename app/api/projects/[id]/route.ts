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

// 项目字段更新 API
//
// PATCH: 更新项目字段(项目金额、备注等)
// 权限:管理员/销售总监/销售经理可访问 Dashboard

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { requireDashboardAccess } from "@/lib/rbac";

const patchProjectSchema = z.object({
  projectAmount: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireDashboardAccess();
    const { id } = await context.params;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
    }

    const parsed = patchProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数校验失败", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // 检查是否有字段需要更新
    const updateData = parsed.data;
    const hasUpdates =
      updateData.projectAmount !== undefined ||
      updateData.notes !== undefined;
    if (!hasUpdates) {
      return NextResponse.json({ error: "没有需要更新的字段" }, { status: 400 });
    }

    // 校验项目归属(租户隔离)
    const rows = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.tenantId, user.id)))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "项目不存在或无权访问" },
        { status: 404 }
      );
    }

    // 构建更新对象
    const setData: Record<string, string | null> = {};
    if (updateData.projectAmount !== undefined) {
      setData.projectAmount = updateData.projectAmount;
    }
    if (updateData.notes !== undefined) {
      setData.notes = updateData.notes;
    }

    await db.update(projects).set(setData).where(eq(projects.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("project update 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新项目失败" },
      { status: 500 }
    );
  }
}