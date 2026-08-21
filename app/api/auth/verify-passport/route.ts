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
import { verifyPassport } from "@/lib/passport";

/**
 * 校验当前用户通行证状态
 * GET /api/auth/verify-passport
 * 返回: { valid: boolean, reason?: string, expiresAt?: string }
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { valid: false, reason: "not_authenticated" },
        { status: 401 }
      );
    }

    const result = await verifyPassport(session.user.id);

    return NextResponse.json({
      valid: result.valid,
      reason: result.reason,
      expiresAt: result.expiresAt?.toISOString(),
    });
  } catch (error) {
    console.error("verify-passport错误:", error);
    return NextResponse.json(
      { valid: false, reason: "server_error" },
      { status: 500 }
    );
  }
}
