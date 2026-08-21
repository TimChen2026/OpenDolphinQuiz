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

// 查询当前用户手机号状态 API
//
// 用途:Quiz 前置守卫判断是否需补充手机号
// Better Auth 的 session.user 不含自定义字段(phone),须查 DB 判断
// 返回 { hasPhone: boolean },未登录返回 401

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ hasPhone: false }, { status: 401 });
    }

    const rows = await db
      .select({ phone: user.phone })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    return NextResponse.json({ hasPhone: Boolean(rows[0]?.phone) });
  } catch (error) {
    // 边界层统一异常处理
    console.error("phone-status 错误:", error);
    return NextResponse.json(
      { error: "查询手机号状态失败" },
      { status: 500 }
    );
  }
}
