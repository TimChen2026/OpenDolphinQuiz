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
import { USER_ROLES, ACCOUNT_TYPES } from "./db/schema";

/**
 * 判断用户是否具有指定角色
 */
export function hasRole(user: AccessUser, role: string): boolean {
  return user.role === role;
}

/**
 * 判断邮箱是否为环境变量中配置的超级管理员
 * 超级管理员为项目开发者本人(唯一),通过 SUPER_ADMIN_EMAIL 环境变量指定,
 * 拥有最高权限,不受数据库 role 字段限制
 */
export function isSuperAdminEmail(email: string | null | undefined): boolean {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  if (!superAdminEmail || !email) {
    return false;
  }
  return email.trim().toLowerCase() === superAdminEmail;
}

/**
 * 判断用户是否为管理员(管理后台准入)
 *
 * 仅环境变量 SUPER_ADMIN_EMAIL 指定的超级管理员可访问管理后台;
 * 数据库 admin 角色仅表示团队管理员,不再授予管理后台权限
 */
export function isAdmin(user: AccessUser): boolean {
  return isSuperAdminEmail(user.email);
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
 * 管理后台仅环境变量指定的超级管理员可访问
 */
export async function requireAdmin(): Promise<AccessUser> {
  const access = await getActiveSessionUser(await headers());
  if (!access.ok) {
    redirect("/login");
  }

  if (!isAdmin(access.user)) {
    redirect("/dashboard");
  }

  return access.user;
}

/**
 * 要求Dashboard访问权限(团队成员),否则重定向
 *
 * 客户(accountType=customer)仅可访问问卷,禁止进入仪表盘;
 * 团队成员(admin/sales_director/sales_manager/user 及销售总监标记)均可访问
 */
export async function requireDashboardAccess(): Promise<AccessUser> {
  const access = await getActiveSessionUser(await headers());
  if (!access.ok) {
    redirect("/login");
  }

  // 客户只可访问问卷,不可访问仪表盘
  if (access.user.accountType === ACCOUNT_TYPES.CUSTOMER) {
    redirect("/quiz");
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

/**
 * 团队上下文(团队成员访问租户数据时的统一入口)
 *
 * - teamId:数据隔离键(tenant_id = team.id = 团队管理员 userId)
 * - teamPlan:团队套餐 = 团队管理员的 plan,团队成员共享团队配额
 */
export type TeamContext = {
  user: AccessUser;
  teamId: string;
  teamPlan: string;
};

/**
 * 要求团队成员身份并返回团队上下文
 *
 * 在 requireDashboardAccess 基础上进一步保证 teamId 非空
 * (客户已在 requireDashboardAccess 拦截,此处为类型收窄)
 *
 * 超级管理员(isSuperAdminEmail)可指定 targetTeamId 访问任意团队
 * 普通用户仍使用自身 teamId,严格遵守团队隔离
 */
export async function requireTeamAccess(targetTeamId?: string): Promise<TeamContext> {
  const accessUser = await requireDashboardAccess();

  // 超级管理员可访问任意团队
  if (isSuperAdminEmail(accessUser.email)) {
    // 使用指定的 teamId 或默认返回 null(后续处理)
    const teamId = targetTeamId ?? accessUser.teamId ?? "";
    if (!teamId) {
      // 超级管理员未指定团队时,返回空 teamId 让调用方处理
      return { user: accessUser, teamId: "", teamPlan: accessUser.plan };
    }
    const { getTeamPlan } = await import("@/lib/teams");
    const teamPlan = await getTeamPlan(teamId);
    return { user: accessUser, teamId, teamPlan };
  }

  // 普通用户:使用自身 teamId
  if (!accessUser.teamId) {
    redirect("/quiz");
  }
  // 团队管理员(teamId = 自身 userId)直接用自身套餐,避免多余查询
  if (accessUser.teamId === accessUser.id) {
    return { user: accessUser, teamId: accessUser.teamId, teamPlan: accessUser.plan };
  }
  const { getTeamPlan } = await import("@/lib/teams");
  const teamPlan = await getTeamPlan(accessUser.teamId);
  return { user: accessUser, teamId: accessUser.teamId, teamPlan };
}
