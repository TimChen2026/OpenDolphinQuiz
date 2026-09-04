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

// GDPR 退订机制(过滤环节 + 链接生成)
//
// 发送营销类邮件前必须调用 excludeUnsubscribed 做差集过滤;
// 生成每封邮件的退订链接使用 buildUnsubscribeUrl。
// 事务类邮件(验证邮箱/重置密码/预警通知)不得过滤,避免影响正常服务。

import { db } from "@/lib/db";
import { unsubscribers } from "@/lib/db/schema";
import { generateUnsubscribeToken } from "@/lib/jwt";

/**
 * 从收件人列表中剔除已退订的邮箱
 *
 * @param recipients 原始收件人列表
 * @returns 过滤后的收件人列表(保持原顺序)
 */
export async function excludeUnsubscribed(
  recipients: string[]
): Promise<string[]> {
  if (recipients.length === 0) {
    return [];
  }

  const blockedRows = await db
    .select({ email: unsubscribers.email })
    .from(unsubscribers);
  const blockedSet = new Set(blockedRows.map((row) => row.email));

  return recipients.filter((email) => !blockedSet.has(email));
}

/**
 * 生成指定邮箱的退订链接
 *
 * 链接格式:{APP_URL}/api/unsubscribe?token=<JWT>
 * 明文邮箱不出现在 URL 中(编码在 Token 内,30 天有效)
 *
 * @param email 收件人邮箱
 * @returns 完整退订 URL
 */
export async function buildUnsubscribeUrl(email: string): Promise<string> {
  const token = await generateUnsubscribeToken(email);
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${baseUrl}/api/unsubscribe?token=${token}`;
}
