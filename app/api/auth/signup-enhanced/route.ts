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

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encrypt, isEncryptionEnabled } from "@/lib/crypto";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { issuePassport } from "@/lib/passport";

/**
 * 增强注册端点:在Better Auth注册成功后,加密存储phone并发放通行证
 * 前端在signUp.email()成功后调用此端点
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 获取当前session(注册后应已登录)
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "未登录,请先完成注册" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. 解析请求体
    const body = await request.json();
    const { phone, turnstileToken } = body as {
      phone?: string;
      turnstileToken?: string;
    };

    if (!phone || !turnstileToken) {
      return NextResponse.json(
        { error: "缺少phone或turnstileToken参数" },
        { status: 400 }
      );
    }

    // 3. 验证Turnstile人机验证
    const turnstileValid = await verifyTurnstileToken(turnstileToken);
    if (!turnstileValid) {
      return NextResponse.json(
        { error: "人机验证失败,请重试" },
        { status: 400 }
      );
    }

    // 4. 加密phone并更新user表
    if (!isEncryptionEnabled()) {
      return NextResponse.json(
        { error: "加密服务未配置,请联系管理员" },
        { status: 500 }
      );
    }

    const encryptedPhone = encrypt(phone);
    await db
      .update(user)
      .set({ phone: encryptedPhone })
      .where(eq(user.id, userId));

    // 5. 发放通行证(24小时有效期)
    await issuePassport(userId);

    return NextResponse.json(
      { success: true, message: "注册增强完成" },
      { status: 200 }
    );
  } catch (error) {
    // 边界层全局异常拦截:记录完整上下文
    console.error("signup-enhanced错误:", error);
    return NextResponse.json(
      { error: "注册增强处理失败,请重试" },
      { status: 500 }
    );
  }
}
