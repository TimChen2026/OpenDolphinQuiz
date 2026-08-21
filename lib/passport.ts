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

import { eq } from "drizzle-orm";
import { db } from "./db";
import { user, PASSPORT_STATUS } from "./db/schema";

// 通行证有效期:24小时
export const PASSPORT_EXPIRY_HOURS = 24;

export type PassportVerifyResult = {
  valid: boolean;
  reason?: "unverified" | "expired" | "not_found";
  expiresAt?: Date;
};

/**
 * 发放通行证(人机验证通过后调用)
 */
export async function issuePassport(userId: string): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PASSPORT_EXPIRY_HOURS * 60 * 60 * 1000);

  await db
    .update(user)
    .set({
      passportStatus: PASSPORT_STATUS.VERIFIED,
      passportVerifiedAt: now,
      passportExpiresAt: expiresAt,
    })
    .where(eq(user.id, userId));
}

/**
 * 校验通行证状态
 */
export async function verifyPassport(userId: string): Promise<PassportVerifyResult> {
  const targetUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: {
      id: true,
      passportStatus: true,
      passportVerifiedAt: true,
      passportExpiresAt: true,
    },
  });

  if (!targetUser) {
    return { valid: false, reason: "not_found" };
  }

  if (targetUser.passportStatus !== PASSPORT_STATUS.VERIFIED) {
    return { valid: false, reason: "unverified" };
  }

  if (!targetUser.passportExpiresAt) {
    return { valid: false, reason: "expired" };
  }

  if (targetUser.passportExpiresAt < new Date()) {
    return { valid: false, reason: "expired", expiresAt: targetUser.passportExpiresAt };
  }

  return { valid: true, expiresAt: targetUser.passportExpiresAt };
}

/**
 * 撤销通行证
 */
export async function revokePassport(userId: string): Promise<void> {
  await db
    .update(user)
    .set({
      passportStatus: PASSPORT_STATUS.UNVERIFIED,
      passportVerifiedAt: null,
      passportExpiresAt: null,
    })
    .where(eq(user.id, userId));
}
