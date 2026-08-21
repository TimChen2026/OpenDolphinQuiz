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
import { user, verification } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Check if user is already verified
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!existingUser || existingUser.length === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const currentUser = existingUser[0];

    if (currentUser.emailVerified) {
      return NextResponse.json(
        { message: "Email is already verified" },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Remove existing verification token before inserting a new one
    await db
      .delete(verification)
      .where(eq(verification.id, `email-verification:${userId}`));

    // Store verification token
    await db.insert(verification).values({
      id: `email-verification:${userId}`,
      identifier: "email-verification",
      value: verificationToken,
      expiresAt,
    });

    // Send verification email
    const result = await sendVerificationEmail(currentUser.email, verificationToken);

    if (!result.success) {
      return NextResponse.json(
        { message: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Verification email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { message: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
