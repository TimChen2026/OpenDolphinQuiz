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
import { user, team, teamMember, USER_ROLES, USER_PLANS } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isAdmin, getCurrentUserWithRole } from "@/lib/auth/admin";
import { isAdmin as hasAdminPermission, hasRole } from "@/lib/rbac";
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

// 合法套餐列表
const VALID_PLANS = [USER_PLANS.FREE, USER_PLANS.PRO, USER_PLANS.MAX];

export async function updateUserPlan(userId: string, newPlan: string) {
  // 检查权限:管理员或超级管理员均可设置用户套餐
  const hasAdminAccess = await isAdmin();
  if (!hasAdminAccess) {
    throw new Error("Unauthorized");
  }

  if (!VALID_PLANS.includes(newPlan as (typeof VALID_PLANS)[number])) {
    throw new Error("套餐不合法,仅支持 free/pro/max");
  }

  await db
    .update(user)
    .set({
      plan: newPlan,
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

/**
 * 重命名用户所属团队(超级管理员专属)
 *
 * 修改会应用到该团队全体成员(团队名称是团队级信息)。
 * 若新名称已被其他团队占用(team.name 唯一约束),抛出错误。
 */
export async function updateUserTeamName(userId: string, newTeamName: string) {
  // 检查权限:仅超级管理员可修改用户团队信息
  const hasAdminAccess = await isAdmin();
  if (!hasAdminAccess) {
    throw new Error("Unauthorized");
  }

  const trimmed = newTeamName.trim();
  if (!trimmed) {
    throw new Error("团队名称不能为空");
  }

  // 找到该用户最早加入的团队
  const membership = await db
    .select({ teamId: teamMember.teamId })
    .from(teamMember)
    .where(eq(teamMember.userId, userId))
    .orderBy(teamMember.joinedAt)
    .limit(1);

  if (!membership.length) {
    throw new Error("该用户暂不属于任何团队");
  }

  // 团队名唯一约束冲突时提前拦截,给出明确错误
  const nameExists = await db
    .select({ id: team.id })
    .from(team)
    .where(eq(team.name, trimmed))
    .limit(1);

  if (nameExists.length && nameExists[0].id !== membership[0].teamId) {
    throw new Error(`团队名称 "${trimmed}" 已被其他团队使用`);
  }

  await db
    .update(team)
    .set({ name: trimmed })
    .where(eq(team.id, membership[0].teamId));

  revalidatePath("/admin/users");
  return { success: true, teamName: trimmed };
}

export async function deleteUser(userId: string) {
  // 检查权限：仅管理员(含超级管理员)可删除用户
  const currentUser = await getCurrentUserWithRole();
  if (!currentUser || !hasAdminPermission(currentUser)) {
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