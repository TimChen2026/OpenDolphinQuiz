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

import { count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { user, teamMember, team } from "@/lib/db/schema";

export const ADMIN_USERS_PAGE_SIZE = 20;

type SearchParamValue = string | string[] | undefined;

export interface AdminUsersDirectorySearchParams {
  page?: SearchParamValue;
  query?: SearchParamValue;
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
}

/**
 * 批量补齐用户所属团队信息(取每个用户 join 时间最早的团队)
 * 团队成员(member/admin)通常仅一个团队;客户(customer)可属多团队,这里展示最早加入的团队
 */
async function attachTeamInfo(
  users: Omit<AdminUserListItem, "teamName" | "teamId">[]
): Promise<AdminUserListItem[]> {
  if (users.length === 0) {
    return [];
  }

  const userIds = users.map((u) => u.id);

  // 按用户取最早加入的团队关联(同用户多团队时取第一条)
  const memberships = await db
    .select({ userId: teamMember.userId, teamId: teamMember.teamId })
    .from(teamMember)
    .where(inArray(teamMember.userId, userIds))
    .orderBy(teamMember.joinedAt);

  const firstTeamByUser = new Map<string, string>();
  for (const membership of memberships) {
    if (!firstTeamByUser.has(membership.userId)) {
      firstTeamByUser.set(membership.userId, membership.teamId);
    }
  }

  const teamIds = Array.from(new Set(firstTeamByUser.values()));
  const teams = teamIds.length > 0
    ? await db
        .select({ id: team.id, name: team.name })
        .from(team)
        .where(inArray(team.id, teamIds))
    : [];
  const teamNameById = new Map(teams.map((t) => [t.id, t.name]));

  return users.map((existing) => {
    const teamId = firstTeamByUser.get(existing.id) ?? null;
    return {
      ...existing,
      teamName: teamId ? (teamNameById.get(teamId) ?? null) : null,
      teamId,
    };
  });
}

export interface AdminUsersDirectoryFilters {
  currentPage: number;
  pageSize: number;
  query: string;
}

export interface AdminUsersDirectoryResult extends AdminUsersDirectoryFilters {
  totalPages: number;
  totalUsers: number;
  users: AdminUserListItem[];
}

function getSingleSearchParam(value?: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeAdminUsersDirectoryFilters(
  searchParams?: AdminUsersDirectorySearchParams
): AdminUsersDirectoryFilters {
  const rawQuery = getSingleSearchParam(searchParams?.query) ?? "";
  const query = rawQuery.trim();

  const rawPage = getSingleSearchParam(searchParams?.page) ?? "1";
  const parsedPage = Number.parseInt(rawPage, 10);

  return {
    currentPage: Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    pageSize: ADMIN_USERS_PAGE_SIZE,
    query,
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
  const whereClause = pattern
    ? or(ilike(user.name, pattern), ilike(user.email, pattern))
    : undefined;

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

  const usersWithTeams = await attachTeamInfo(users);

  return {
    currentPage,
    pageSize: requestedFilters.pageSize,
    query: requestedFilters.query,
    totalPages,
    totalUsers,
    users: usersWithTeams,
  };
}
