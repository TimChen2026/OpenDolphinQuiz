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
import { getResendClient, sendEmail } from "@/lib/email";
import crypto from "crypto";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = subscribeSchema.parse(body);

    // Check if already subscribed
    const existing = await db
      .select()
      .from(newsletterSubscription)
      .where(eq(newsletterSubscription.email, email))
      .limit(1);

    if (existing && existing.length > 0) {
      const subscription = existing[0];
      
      if (subscription.status === "active") {
        return NextResponse.json(
          { message: "You're already subscribed!" },
          { status: 400 }
        );
      }
      
      // Reactivate subscription
      await db
        .update(newsletterSubscription)
        .set({
          status: "active",
          subscribedAt: new Date(),
          unsubscribedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(newsletterSubscription.id, subscription.id));

      // Update Resend Audience if configured
      const resend = getResendClient();
      if (process.env.RESEND_AUDIENCE_ID && resend) {
        try {
          // Try to update existing contact
          await resend.contacts.update({
            email,
            audienceId: process.env.RESEND_AUDIENCE_ID,
            unsubscribed: false,
          });
        } catch {
          // If contact doesn't exist, create it
          try {
            await resend.contacts.create({
              email,
              audienceId: process.env.RESEND_AUDIENCE_ID,
              unsubscribed: false,
            });
          } catch (createError) {
            console.error("Failed to sync with Resend Audience:", createError);
          }
        }
      }

      // Send reactivation confirmation
      await sendEmail({
        to: email,
        subject: "Welcome back to DolphinQuiz Newsletter!",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Welcome Back!</h1>
            <p>You've successfully resubscribed to the DolphinQuiz newsletter.</p>
            <p>You'll receive our latest updates and insights directly in your inbox.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              To unsubscribe, click <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/unsubscribe?token=${subscription.unsubscribeToken}">here</a>
            </p>
          </div>
        `,
      });

      return NextResponse.json(
        { message: "Successfully resubscribed to newsletter!" },
        { status: 200 }
      );
    }

    // Create new subscription
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');
    const subscriptionId = crypto.randomUUID();

    await db.insert(newsletterSubscription).values({
      id: subscriptionId,
      email,
      unsubscribeToken,
      status: "active",
    });

    // Add to Resend Audience if configured
    const resend = getResendClient();
    if (process.env.RESEND_AUDIENCE_ID && resend) {
      try {
        await resend.contacts.create({
          email,
          audienceId: process.env.RESEND_AUDIENCE_ID,
          unsubscribed: false,
        });
      } catch (audienceError) {
        console.error("Failed to add contact to Resend Audience:", audienceError);
        // Don't fail the subscription if audience sync fails
      }
    }

    // Send welcome email
    await sendEmail({
      to: email,
      subject: "Welcome to DolphinQuiz Newsletter!",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Welcome to DolphinQuiz Newsletter!</h1>
          <p>Thank you for subscribing! You'll receive our latest updates and insights directly in your inbox.</p>
          <h3>What to expect:</h3>
          <ul>
            <li>Product updates and new features</li>
            <li>AI industry insights</li>
            <li>Tips and tutorials</li>
            <li>Exclusive offers for subscribers</li>
          </ul>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            You can unsubscribe at any time by clicking <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/unsubscribe?token=${unsubscribeToken}">here</a>
          </p>
        </div>
      `,
    });

    return NextResponse.json(
      { message: "Successfully subscribed to newsletter!" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0].message },
        { status: 400 }
      );
    }
    
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { message: "Failed to subscribe. Please try again." },
      { status: 500 }
    );
  }
}
