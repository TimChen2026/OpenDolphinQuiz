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
import { getActiveSessionUser, type AccessUser } from "@/lib/auth/session";
import {
  isAdmin as hasAdminRole,
  requireAdmin as requireAdminRole,
} from "@/lib/rbac";

/**
 * 检查当前登录用户是否为管理员
 * 向后兼容封装:保留无参数签名,内部调用rbac
 */
export async function isAdmin(): Promise<boolean> {
  const access = await getActiveSessionUser(await headers());
  if (!access.ok) {
    return false;
  }

  return hasAdminRole(access.user);
}

/**
 * 保护路由仅管理员可访问
 * 非管理员重定向到dashboard
 */
export async function requireAdmin(): Promise<void> {
  await requireAdminRole();
}

/**
 * 获取当前登录用户(含角色信息)
 */
export async function getCurrentUserWithRole(): Promise<AccessUser | null> {
  const access = await getActiveSessionUser(await headers());
  if (!access.ok) {
    return null;
  }

  return access.user;
}
