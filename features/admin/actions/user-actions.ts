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

"use server";

import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";

export async function updateUserRole(userId: string, newRole: string) {
  // 检查权限
  const hasAdminAccess = await isAdmin();
  if (!hasAdminAccess) {
    throw new Error("Unauthorized");
  }

  // 更新用户角色
  await db
    .update(user)
    .set({ 
      role: newRole,
      updatedAt: new Date()
    })
    .where(eq(user.id, userId));

  revalidatePath("/admin/users");
  return { success: true };
}

export async function banUser(userId: string, banned: boolean, reason?: string) {
  // 检查权限
  const hasAdminAccess = await isAdmin();
  if (!hasAdminAccess) {
    throw new Error("Unauthorized");
  }

  // 更新用户禁用状态
  await db
    .update(user)
    .set({ 
      banned,
      banReason: banned ? reason : null,
      banExpires: null, // 可以扩展支持临时禁用
      updatedAt: new Date()
    })
    .where(eq(user.id, userId));

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(userId: string) {
  // 检查权限
  const hasAdminAccess = await isAdmin();
  if (!hasAdminAccess) {
    throw new Error("Unauthorized");
  }

  // 注意：由于外键约束，删除用户会级联删除相关数据
  // 建议使用软删除（banned状态）而不是真正删除
  await db
    .delete(user)
    .where(eq(user.id, userId));

  revalidatePath("/admin/users");
  return { success: true };
}