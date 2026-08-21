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
import { newsletterSubscription } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getResendClient } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { message: "Unsubscribe token is required" },
        { status: 400 }
      );
    }

    // Find subscription by token
    const subscription = await db
      .select()
      .from(newsletterSubscription)
      .where(eq(newsletterSubscription.unsubscribeToken, token))
      .limit(1);

    if (!subscription || subscription.length === 0) {
      return NextResponse.json(
        { message: "Invalid unsubscribe link" },
        { status: 400 }
      );
    }

    const sub = subscription[0];

    // Update subscription status
    await db
      .update(newsletterSubscription)
      .set({
        status: "unsubscribed",
        unsubscribedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(newsletterSubscription.id, sub.id));

    // Update Resend Audience if configured
    const resend = getResendClient();
    if (process.env.RESEND_AUDIENCE_ID && resend) {
      try {
        await resend.contacts.update({
          email: sub.email,
          audienceId: process.env.RESEND_AUDIENCE_ID,
          unsubscribed: true,
        });
      } catch (audienceError) {
        console.error("Failed to update Resend Audience:", audienceError);
        // Don't fail the unsubscribe if audience sync fails
      }
    }

    // Create unsubscribe success page HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed - DolphinQuiz</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 3rem;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            text-align: center;
          }
          h1 { color: #333; margin-bottom: 1rem; }
          p { color: #666; line-height: 1.6; margin-bottom: 2rem; }
          a {
            display: inline-block;
            padding: 12px 24px;
            background: #000;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            transition: opacity 0.2s;
          }
          a:hover { opacity: 0.8; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>You've been unsubscribed</h1>
          <p>
            You have been successfully unsubscribed from the DolphinQuiz newsletter. 
            We're sorry to see you go!
          </p>
          <p>
            You can resubscribe anytime from our website.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}">Back to DolphinQuiz</a>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    return NextResponse.json(
      { message: "Failed to unsubscribe. Please try again." },
      { status: 500 }
    );
  }
}
