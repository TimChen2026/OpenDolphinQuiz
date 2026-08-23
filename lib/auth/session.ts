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

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type AccessUser = {
  banExpires: Date | null;
  banned: boolean;
  emailVerified: boolean;
  id: string;
  email: string;
  /** 套餐:free | pro | max */
  plan: string;
  role: string;
  /** 是否兼任销售总监(is_director 标记,验收修订 2.1.7.5) */
  isDirector: boolean;
};

type ActiveSessionResult =
  | {
      ok: true;
      user: AccessUser;
    }
  | {
      ok: false;
      error: string;
      status: 401 | 403;
    };

type AccessResolutionOptions = {
  now?: Date;
};

export function isBanActive(
  targetUser: Pick<AccessUser, "banned" | "banExpires">,
  { now = new Date() }: AccessResolutionOptions = {}
) {
  if (!targetUser.banned) {
    return false;
  }

  if (!targetUser.banExpires) {
    return true;
  }

  return targetUser.banExpires.getTime() > now.getTime();
}

export function resolveSessionAccess(
  targetUser: AccessUser | null,
  options: AccessResolutionOptions = {}
): ActiveSessionResult {
  if (!targetUser) {
    return {
      ok: false,
      error: "Unauthorized",
      status: 401,
    };
  }

  if (isBanActive(targetUser, options)) {
    return {
      ok: false,
      error: "User is banned",
      status: 403,
    };
  }

  return {
    ok: true,
    user: targetUser,
  };
}

export async function getActiveSessionUser(
  requestHeaders: Headers,
  options: AccessResolutionOptions = {}
): Promise<ActiveSessionResult> {
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  const userId = session?.session?.userId;
  if (!userId) {
    return {
      ok: false,
      error: "Unauthorized",
      status: 401,
    };
  }

  const dbUsers = await db
    .select({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      banned: user.banned,
      banExpires: user.banExpires,
      plan: user.plan,
      role: user.role,
      isDirector: user.isDirector,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return resolveSessionAccess(dbUsers[0] ?? null, options);
}
