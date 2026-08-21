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

import { count, desc, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

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
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
          banned: user.banned,
          banReason: user.banReason,
          banExpires: user.banExpires,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
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
          banned: user.banned,
          banReason: user.banReason,
          banExpires: user.banExpires,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        })
        .from(user)
        .orderBy(desc(user.createdAt))
        .limit(requestedFilters.pageSize)
        .offset(offset));

  return {
    currentPage,
    pageSize: requestedFilters.pageSize,
    query: requestedFilters.query,
    totalPages,
    totalUsers,
    users,
  };
}
