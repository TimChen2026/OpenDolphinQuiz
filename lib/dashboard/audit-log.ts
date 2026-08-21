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

// 审计日志记录(Phase 4 Task 4.7,AC-13)
//
// 功能:
// - logAudit: 记录审计日志
// - getAuditLogs: 查询审计日志(分页,租户隔离)
// - 记录登录、导出、删除、更新、创建等关键操作

import { db } from "@/lib/db";
import { auditLogs, AUDIT_ACTION_TYPES } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export type AuditActionType = (typeof AUDIT_ACTION_TYPES)[keyof typeof AUDIT_ACTION_TYPES];

export type AuditLogInput = {
  userId: string;
  actionType: AuditActionType;
  description: string;
  details?: string | null;
  ipAddress?: string | null;
};

export type AuditLogEntry = {
  id: string;
  userId: string;
  actionType: string;
  description: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
};

/**
 * 记录审计日志
 */
export async function logAudit(input: AuditLogInput): Promise<void> {
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    userId: input.userId,
    actionType: input.actionType,
    description: input.description,
    details: input.details ?? null,
    ipAddress: input.ipAddress ?? null,
  });
}

/**
 * 获取用户的审计日志(分页,按时间倒序)
 */
export async function getAuditLogs(
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<AuditLogEntry[]> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const rows = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    actionType: row.actionType,
    description: row.description,
    details: row.details,
    ipAddress: row.ipAddress,
    createdAt: row.createdAt?.toISOString() ?? "",
  }));
}