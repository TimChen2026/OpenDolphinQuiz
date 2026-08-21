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
import { user, passwordResetToken, account } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (!existingUser || existingUser.length === 0) {
      // Don't reveal if email exists or not
      return NextResponse.json(
        { message: "If the email exists, a reset link has been sent." },
        { status: 200 }
      );
    }

    const foundUser = existingUser[0];

    // Ensure user has a credential account before sending email
    const credentialAccount = await db
      .select({ id: account.id })
      .from(account)
      .where(
        and(
          eq(account.userId, foundUser.id),
          eq(account.providerId, "credential")
        )
      )
      .limit(1);

    if (credentialAccount.length === 0) {
      // Return generic response to avoid leaking account type
      return NextResponse.json(
        { message: "If the email exists, a reset link has been sent." },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set token expiry to 1 hour from now
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Remove any existing tokens for the user before inserting a new one
    await db
      .delete(passwordResetToken)
      .where(eq(passwordResetToken.userId, foundUser.id));

    // Store token in database
    await db.insert(passwordResetToken).values({
      id: crypto.randomUUID(),
      userId: foundUser.id,
      token: hashedToken,
      expiresAt,
    });

    // Send reset email
    const result = await sendPasswordResetEmail(email, resetToken);

    if (!result.success) {
      console.error("Failed to send password reset email:", result.error);
      return NextResponse.json(
        { message: "Failed to send reset email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "If the email exists, a reset link has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { message: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
