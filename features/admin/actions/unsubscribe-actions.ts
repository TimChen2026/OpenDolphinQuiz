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

// Admin Panel · Unsubscribe 板块的 Server Action
// 仅为管理员生成退订链接,权限校验与 user-actions.ts 保持一致

import { isAdmin } from "@/lib/auth/admin";
import { buildUnsubscribeUrl } from "@/lib/email-unsubscribe";

export async function generateUnsubscribeLinkAction(
  email: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { success: false, error: "invalid_email" };
  }

  try {
    const url = await buildUnsubscribeUrl(normalizedEmail);
    return { success: true, url };
  } catch (error) {
    // JWT_SECRET 未配置等情况:转换型异常,记录日志后返回业务错误码
    console.error(
      "generateUnsubscribeLinkAction 失败:",
      error instanceof Error ? error.message : error
    );
    return { success: false, error: "generate_failed" };
  }
}
