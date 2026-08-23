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
  /** 账号类型:member(团队成员,单团队) | customer(客户,可多团队,仅问卷) */
  accountType: string;
  /** 所属团队 ID(= 团队管理员 userId);客户无单一团队上下文,为 null */
  teamId: string | null;
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
      name: user.name,
      emailVerified: user.emailVerified,
      banned: user.banned,
      banExpires: user.banExpires,
      plan: user.plan,
      role: user.role,
      isDirector: user.isDirector,
      accountType: user.accountType,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const dbUser = dbUsers[0] ?? null;
  if (!dbUser) {
    return resolveSessionAccess(null, options);
  }

  const resolved = resolveSessionAccess(
    {
      id: dbUser.id,
      email: dbUser.email,
      emailVerified: dbUser.emailVerified,
      banned: dbUser.banned,
      banExpires: dbUser.banExpires,
      plan: dbUser.plan,
      role: dbUser.role,
      isDirector: dbUser.isDirector,
      accountType: dbUser.accountType,
      // 团队归属在下方解析(客户为 null)
      teamId: null,
    },
    options
  );

  if (!resolved.ok) {
    return resolved;
  }

  // 解析团队归属:客户返回 null;存量用户惰性迁移创建团队
  const { resolveUserTeamId } = await import("@/lib/teams");
  const teamId = await resolveUserTeamId({
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    accountType: dbUser.accountType,
  });

  return { ...resolved, user: { ...resolved.user, teamId } };
}
