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
import { getActiveSessionUser } from "./auth/session";

/**
 * 获取当前租户 ID(即当前用户所属团队的 ID)
 * 团队模型:tenant_id = team.id(= 团队管理员的 user.id)
 * 客户(accountType=customer)无租户上下文,调用视为未授权
 */
export async function getCurrentTenantId(): Promise<string> {
  const access = await getActiveSessionUser(await headers());
  if (!access.ok) {
    throw new Error(access.error || "未登录");
  }
  if (!access.user.teamId) {
    throw new Error("客户账号无团队租户权限");
  }
  return access.user.teamId;
}

/**
 * 校验当前用户对指定租户资源的归属权
 * 用于防止跨租户/跨团队访问
 */
export async function assertTenantOwnership(tenantId: string): Promise<void> {
  const currentTenantId = await getCurrentTenantId();
  if (currentTenantId !== tenantId) {
    throw new Error("无权访问该租户资源");
  }
}

/**
 * 获取当前租户 ID(可为 null,用于可选场景)
 * 不会抛出异常,未登录或客户时返回 null
 */
export async function getCurrentTenantIdOrNull(): Promise<string | null> {
  try {
    return await getCurrentTenantId();
  } catch {
    return null;
  }
}
