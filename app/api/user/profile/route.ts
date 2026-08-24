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
import { user as userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getActiveSessionUser } from "@/lib/auth/session";
import {
  normalizeProfileName,
  updateProfileSchema,
} from "@/lib/account-settings";
import { getTeamName, getUserFirstTeamName } from "@/lib/teams";

export async function GET(req: NextRequest) {
  try {
    // 从 Better Auth 获取会话
    const access = await getActiveSessionUser(req.headers);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const userId = access.user.id;

    // 获取用户信息
    const users = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        emailVerified: userTable.emailVerified,
        image: userTable.image,
        accountType: userTable.accountType,
        createdAt: userTable.createdAt,
      })
      .from(userTable)
      .where(eq(userTable.id, userId));

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[0];

    // 附加所属团队名称
    // 正式用户:取自身团队;客户(可属多团队、teamId 为 null):取最早加入的团队(与后台展示一致)
    const teamName = access.user.teamId
      ? await getTeamName(access.user.teamId)
      : await getUserFirstTeamName(userId);

    return NextResponse.json({ user, teamName });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const access = await getActiveSessionUser(req.headers);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid profile data" },
        { status: 400 }
      );
    }

    const normalizedName = normalizeProfileName(parsed.data.name);

    const updatedUsers = await db
      .update(userTable)
      .set({ name: normalizedName, updatedAt: new Date() })
      .where(eq(userTable.id, access.user.id))
      .returning({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        emailVerified: userTable.emailVerified,
        image: userTable.image,
        createdAt: userTable.createdAt,
      });

    const updatedUser = updatedUsers[0];

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
