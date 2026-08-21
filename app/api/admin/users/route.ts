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

// 内部管理 - 用户角色(RBAC)管理 API(Phase 3 验收修订 2.1.9)
//
// GET: 列出全部用户(内部网页分配角色用)
// PUT: 更新指定用户的角色
// 权限:仅 admin 可访问

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/rbac";
import { db } from "@/lib/db";
import { user, USER_ROLES } from "@/lib/db/schema";

// 可选角色列表
const VALID_ROLES = [
  USER_ROLES.ADMIN,
  USER_ROLES.SALES_DIRECTOR,
  USER_ROLES.SALES_MANAGER,
  USER_ROLES.USER,
];

export async function GET() {
  try {
    await requireAdmin();

    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(user.createdAt);

    return NextResponse.json({ users });
  } catch (error) {
    console.error("admin users GET 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取用户列表失败" },
      { status: 500 }
    );
  }
}

const updateRoleSchema = z.object({
  userId: z.string().min(1, "缺少用户 ID"),
  role: z.enum(VALID_ROLES as [string, ...string[]], "角色不合法"),
});

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
    }

    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数校验失败", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // 防止把最后一个 admin 降级(避免系统失去管理入口)
    if (parsed.data.role !== USER_ROLES.ADMIN) {
      const adminCount = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.role, USER_ROLES.ADMIN));
      if (adminCount.length <= 1) {
        const target = await db
          .select({ role: user.role })
          .from(user)
          .where(eq(user.id, parsed.data.userId))
          .limit(1);
        if (target[0]?.role === USER_ROLES.ADMIN) {
          return NextResponse.json(
            { error: "系统至少需要保留一名管理员" },
            { status: 400 }
          );
        }
      }
    }

    await db
      .update(user)
      .set({ role: parsed.data.role })
      .where(eq(user.id, parsed.data.userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin users PUT 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新角色失败" },
      { status: 500 }
    );
  }
}
