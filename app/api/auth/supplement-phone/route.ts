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

// 补充手机号 API
//
// 用途:Google 登录用户无手机号,进入 Quiz 前可补充(非强制)
// 流程:校验登录 → 校验手机号格式 → 加密存储到 user.phone
//
// 说明:不强制 Turnstile 人机验证,用户已通过登录/注册验证

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { encrypt, isEncryptionEnabled } from "@/lib/crypto";
import { isValidPhone } from "@/lib/phone";

export async function POST(request: NextRequest) {
  try {
    // 1. 校验登录
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    // 2. 解析并校验手机号
    const body = await request.json().catch(() => null);
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: "请输入有效的手机号" },
        { status: 400 }
      );
    }

    // 3. 加密存储
    if (!isEncryptionEnabled()) {
      return NextResponse.json(
        { error: "加密服务未配置,请联系管理员" },
        { status: 500 }
      );
    }

    await db
      .update(user)
      .set({ phone: encrypt(phone) })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    // 边界层统一异常处理
    console.error("supplement-phone 错误:", error);
    return NextResponse.json(
      { error: "手机号补充失败,请重试" },
      { status: 500 }
    );
  }
}
