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

import { and, count, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  user,
  teamMember,
  team,
  USER_ROLES,
  USER_PLANS,
  ACCOUNT_TYPES,
  TEAM_MEMBER_ROLES,
} from "@/lib/db/schema";
import { isSuperAdminEmail } from "@/lib/rbac";

export const ADMIN_USERS_PAGE_SIZE = 20;

type SearchParamValue = string | string[] | undefined;

export interface AdminUsersDirectorySearchParams {
  page?: SearchParamValue;
  query?: SearchParamValue;
  /** 角色筛选:admin | sales_director | sales_manager | user */
  role?: SearchParamValue;
  /** 套餐筛选:free | pro | max */
  plan?: SearchParamValue;
  /** 账号类型筛选:member(成员) | customer(客户/Guest) */
  accountType?: SearchParamValue;
  /** 邮箱验证状态筛选:true | false */
  emailVerified?: SearchParamValue;
  /** 团队筛选:团队 ID */
  team?: SearchParamValue;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  plan: string;
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
  /** 账号类型:member(团队成员) | customer(客户/Guest) */
  accountType: string;
  /** 用户所属团队名称(按加入时间取第一个团队;客户可属多团队) */
  teamName: string | null;
  /** 用户所属团队 ID(取第一个团队;无团队为 null) */
  teamId: string | null;
  /** 是否为超级管理员(SUPER_ADMIN_EMAIL 指定的唯一平台管理员) */
  isSuperAdmin: boolean;
  /** 是否为团队管理员(最早加入的团队中 teamMember.role = admin,与仪表盘团队界面口径一致) */
  isTeamAdmin: boolean;
}

/**
 * 批量补齐用户所属团队信息(取每个用户 join 时间最早的团队)
 * 团队成员(member/admin)通常仅一个团队;客户(customer)可属多团队,这里展示最早加入的团队
 */
async function attachTeamInfo(
  users: Omit<AdminUserListItem, "teamName" | "teamId" | "isSuperAdmin" | "isTeamAdmin">[]
): Promise<Omit<AdminUserListItem, "isSuperAdmin">[]> {
  if (users.length === 0) {
    return [];
  }

  const userIds = users.map((u) => u.id);

  // 按用户取最早加入的团队关联(同用户多团队时取第一条,同时记录团队内角色)
  const memberships = await db
    .select({
      userId: teamMember.userId,
      teamId: teamMember.teamId,
      role: teamMember.role,
    })
    .from(teamMember)
    .where(inArray(teamMember.userId, userIds))
    .orderBy(teamMember.joinedAt);

  // 记录每个用户最早加入团队的 ID 与团队内角色
  const firstTeamByUser = new Map<string, { teamId: string; role: string }>();
  for (const membership of memberships) {
    if (!firstTeamByUser.has(membership.userId)) {
      firstTeamByUser.set(membership.userId, {
        teamId: membership.teamId,
        role: membership.role,
      });
    }
  }

  const teamIds = Array.from(
    new Set(Array.from(firstTeamByUser.values()).map((m) => m.teamId))
  );
  const teams = teamIds.length > 0
    ? await db
        .select({ id: team.id, name: team.name })
        .from(team)
        .where(inArray(team.id, teamIds))
    : [];
  const teamNameById = new Map(teams.map((t) => [t.id, t.name]));

  return users.map((existing) => {
    const membership = firstTeamByUser.get(existing.id);
    const teamId = membership?.teamId ?? null;
    return {
      ...existing,
      teamName: teamId ? (teamNameById.get(teamId) ?? null) : null,
      teamId,
      // 团队管理员 = teamMember.role = admin(创建团队/首个加入者),与仪表盘团队界面一致
      isTeamAdmin: membership?.role === TEAM_MEMBER_ROLES.ADMIN,
    };
  });
}

export interface AdminUsersDirectoryFilters {
  currentPage: number;
  pageSize: number;
  query: string;
  role?: string;
  plan?: string;
  accountType?: string;
  emailVerified?: string;
  team?: string;
}

export interface AdminUsersDirectoryResult extends AdminUsersDirectoryFilters {
  totalPages: number;
  totalUsers: number;
  users: AdminUserListItem[];
}

function getSingleSearchParam(value?: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

// 筛选参数白名单:非法值一律忽略,防止注入任意 SQL 条件
const VALID_ROLE_FILTERS = new Set<string>(Object.values(USER_ROLES));
const VALID_PLAN_FILTERS = new Set<string>(Object.values(USER_PLANS));
const VALID_ACCOUNT_TYPE_FILTERS = new Set<string>(Object.values(ACCOUNT_TYPES));
const VALID_EMAIL_VERIFIED_FILTERS = new Set(["true", "false"]);

export function normalizeAdminUsersDirectoryFilters(
  searchParams?: AdminUsersDirectorySearchParams
): AdminUsersDirectoryFilters {
  const rawQuery = getSingleSearchParam(searchParams?.query) ?? "";
  const query = rawQuery.trim();

  const rawPage = getSingleSearchParam(searchParams?.page) ?? "1";
  const parsedPage = Number.parseInt(rawPage, 10);

  const rawRole = getSingleSearchParam(searchParams?.role) ?? "";
  const rawPlan = getSingleSearchParam(searchParams?.plan) ?? "";
  const rawAccountType = getSingleSearchParam(searchParams?.accountType) ?? "";
  const rawEmailVerified = getSingleSearchParam(searchParams?.emailVerified) ?? "";
  // 团队 ID 为动态值,不做静态白名单;参数化子查询保证安全,空白视为无筛选
  const rawTeam = getSingleSearchParam(searchParams?.team) ?? "";

  return {
    currentPage: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    pageSize: ADMIN_USERS_PAGE_SIZE,
    query,
    role: VALID_ROLE_FILTERS.has(rawRole) ? rawRole : undefined,
    plan: VALID_PLAN_FILTERS.has(rawPlan) ? rawPlan : undefined,
    accountType: VALID_ACCOUNT_TYPE_FILTERS.has(rawAccountType)
      ? rawAccountType
      : undefined,
    emailVerified: VALID_EMAIL_VERIFIED_FILTERS.has(rawEmailVerified)
      ? rawEmailVerified
      : undefined,
    team: rawTeam.trim() || undefined,
  };
}

export function getAdminUsersTotalPages(totalUsers: number, pageSize = ADMIN_USERS_PAGE_SIZE) {
  return Math.max(1, Math.ceil(totalUsers / pageSize));
}

export async function getAdminUsersDirectory(
  searchParams?: AdminUsersDirectorySearchParams
): Promise<AdminUsersDirectoryResult> {
  const requestedFilters = normalizeAdminUsersDirectoryFilters(searchParams);
  const pattern = requestedFilters.query ? `%${requestedFilters.query}%` : undefined;

  // 组合筛选:关键字(姓名/邮箱) + 角色 + 套餐 + 账号类型 + 邮箱验证状态
  const conditions: SQL[] = [];
  if (pattern) {
    conditions.push(
      or(ilike(user.name, pattern), ilike(user.email, pattern)) as SQL
    );
  }
  if (requestedFilters.role) {
    conditions.push(eq(user.role, requestedFilters.role));
  }
  if (requestedFilters.plan) {
    conditions.push(eq(user.plan, requestedFilters.plan));
  }
  if (requestedFilters.accountType) {
    conditions.push(eq(user.accountType, requestedFilters.accountType));
  }
  if (requestedFilters.emailVerified !== undefined) {
    conditions.push(
      eq(user.emailVerified, requestedFilters.emailVerified === "true")
    );
  }
  // 团队筛选:用户属于该团队(任一团队关联,与表格展示口径一致)
  if (requestedFilters.team) {
    conditions.push(
      inArray(
        user.id,
        db
          .select({ userId: teamMember.userId })
          .from(teamMember)
          .where(eq(teamMember.teamId, requestedFilters.team))
      )
    );
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ totalUsers: totalUsersValue }] = await (whereClause
    ? db.select({ totalUsers: count() }).from(user).where(whereClause)
    : db.select({ totalUsers: count() }).from(user));

  const totalUsers = Number(totalUsersValue ?? 0);
  const totalPages = getAdminUsersTotalPages(totalUsers, requestedFilters.pageSize);
  const currentPage = Math.min(requestedFilters.currentPage, totalPages);
  const offset = (currentPage - 1) * requestedFilters.pageSize;

  const users = await (whereClause
    ? db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          role: user.role,
          plan: user.plan,
          banned: user.banned,
          banReason: user.banReason,
          banExpires: user.banExpires,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          accountType: user.accountType,
        })
        .from(user)
        .where(whereClause)
        .orderBy(desc(user.createdAt))
        .limit(requestedFilters.pageSize)
        .offset(offset)
    : db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          role: user.role,
          plan: user.plan,
          banned: user.banned,
          banReason: user.banReason,
          banExpires: user.banExpires,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          accountType: user.accountType,
        })
        .from(user)
        .orderBy(desc(user.createdAt))
        .limit(requestedFilters.pageSize)
        .offset(offset));

  // 标记超级管理员(SUPER_ADMIN_EMAIL 指定,用于表格 S-Admin / T-Admin 区分展示)
  const usersWithTeams = (await attachTeamInfo(users)).map((u) => ({
    ...u,
    isSuperAdmin: isSuperAdminEmail(u.email),
  }));

  return {
    currentPage,
    pageSize: requestedFilters.pageSize,
    query: requestedFilters.query,
    totalPages,
    totalUsers,
    users: usersWithTeams,
  };
}
