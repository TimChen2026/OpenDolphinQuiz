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
import { user, USER_ROLES } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin, getCurrentUserWithRole } from "@/lib/auth/admin";
import { hasRole } from "@/lib/rbac";
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
  // 检查权限：仅管理员可删除用户
  const currentUser = await getCurrentUserWithRole();
  if (!currentUser || !hasRole(currentUser, USER_ROLES.ADMIN)) {
    throw new Error("Unauthorized");
  }

  // 不允许删除自己
  if (currentUser.id === userId) {
    throw new Error("不能删除自己的账号");
  }

  // 不允许删除其他管理员
  const targetUser = await db
    .select({ role: user.role, name: user.name })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!targetUser.length) {
    throw new Error("用户不存在");
  }

  if (targetUser[0].role === USER_ROLES.ADMIN) {
    throw new Error("不能删除管理员账号");
  }

  // 不允许删除销售总监（删除销售总监会影响项目数据）
  if (targetUser[0].role === USER_ROLES.SALES_DIRECTOR) {
    throw new Error("不能删除销售总监，请联系系统管理员");
  }

  // 执行删除（级联删除 session、account 等关联数据）
  await db
    .delete(user)
    .where(eq(user.id, userId));

  revalidatePath("/admin/users");
  return { success: true };
}