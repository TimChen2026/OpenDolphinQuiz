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
import { db } from "@/lib/db";
import { passwordResetToken } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, message: "Token is required" },
        { status: 400 }
      );
    }

    // Hash the token to match what's in database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find valid token
    const validToken = await db
      .select()
      .from(passwordResetToken)
      .where(
        and(
          eq(passwordResetToken.token, hashedToken),
          gt(passwordResetToken.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!validToken || validToken.length === 0) {
      return NextResponse.json(
        { valid: false, message: "Invalid or expired token" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { valid: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { valid: false, message: "An error occurred" },
      { status: 500 }
    );
  }
}