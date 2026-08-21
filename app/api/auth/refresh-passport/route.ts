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
import { verifyTurnstileToken } from "@/lib/turnstile";
import { issuePassport } from "@/lib/passport";

/**
 * 重新发放通行证(用户通过Turnstile人机验证后调用)
 * POST /api/auth/refresh-passport
 * body: { turnstileToken: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { turnstileToken } = body as { turnstileToken?: string };

    if (!turnstileToken) {
      return NextResponse.json(
        { error: "缺少turnstileToken参数" },
        { status: 400 }
      );
    }

    // 验证Turnstile人机验证
    const turnstileValid = await verifyTurnstileToken(turnstileToken);
    if (!turnstileValid) {
      return NextResponse.json(
        { error: "人机验证失败" },
        { status: 400 }
      );
    }

    // 重新发放通行证(24小时有效期)
    await issuePassport(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("refresh-passport错误:", error);
    return NextResponse.json(
      { error: "通行证刷新失败" },
      { status: 500 }
    );
  }
}
