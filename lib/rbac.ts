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

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getActiveSessionUser, type AccessUser } from "./auth/session";
import { USER_ROLES } from "./db/schema";

/**
 * 判断用户是否具有指定角色
 */
export function hasRole(user: AccessUser, role: string): boolean {
  return user.role === role;
}

/**
 * 判断用户是否为管理员
 */
export function isAdmin(user: AccessUser): boolean {
  return hasRole(user, USER_ROLES.ADMIN);
}

/**
 * 判断用户是否为销售总监
 */
export function isSalesDirector(user: AccessUser): boolean {
  return hasRole(user, USER_ROLES.SALES_DIRECTOR);
}

/**
 * 判断用户是否为销售经理
 */
export function isSalesManager(user: AccessUser): boolean {
  return hasRole(user, USER_ROLES.SALES_MANAGER);
}

/**
 * 要求用户具有指定角色之一,否则重定向到对应页面
 * 未登录重定向到 /login,角色不足重定向到 /dashboard
 */
export async function requireRole(...roles: string[]): Promise<AccessUser> {
  const access = await getActiveSessionUser(await headers());
  if (!access.ok) {
    redirect("/login");
  }

  if (!roles.includes(access.user.role)) {
    redirect("/dashboard");
  }

  return access.user;
}

/**
 * 要求管理员权限,否则重定向
 */
export async function requireAdmin(): Promise<AccessUser> {
  return requireRole(USER_ROLES.ADMIN);
}

/**
 * 要求Dashboard访问权限(admin/sales_director/sales_manager/普通注册用户/销售总监标记),否则重定向
 * 免费客户(普通 user 角色)也应可进入仪表盘查看与使用
 */
export async function requireDashboardAccess(): Promise<AccessUser> {
  const access = await getActiveSessionUser(await headers());
  if (!access.ok) {
    redirect("/login");
  }

  const allowedRoles = [
    USER_ROLES.ADMIN,
    USER_ROLES.SALES_DIRECTOR,
    USER_ROLES.SALES_MANAGER,
    USER_ROLES.USER,
  ];
  // 销售总监标记(is_director)用户同样可访问 Dashboard(验收修订 2.1.7.5)
  if (!(allowedRoles as string[]).includes(access.user.role) && !access.user.isDirector) {
    redirect("/dashboard");
  }

  return access.user;
}
