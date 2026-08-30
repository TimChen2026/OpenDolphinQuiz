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

// 项目状态流转管理(Phase 3 Task 3.8)
//
// 功能:
// - 获取项目列表(交互界面展示)
// - 更新项目状态:follow_up → lost/won,lost 可再次变回 follow_up(需求 2.2.3.14)
// - 项目结束(won/lost)后停止预警(Cron 判断用)
//
// 状态约束:
// - 默认"follow_up"
// - 允许流转:follow_up → lost、follow_up → won、lost → follow_up
// - won 后不允许再变更(业务终态)

import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, PROJECT_STATUS } from "@/lib/db/schema";

// 项目状态类型
export type ProjectStatus =
  | typeof PROJECT_STATUS.FOLLOW_UP
  | typeof PROJECT_STATUS.WON
  | typeof PROJECT_STATUS.LOST;

// 项目状态流转规则:当前状态 -> 允许的目标状态集合
const STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  [PROJECT_STATUS.FOLLOW_UP]: [
    PROJECT_STATUS.FOLLOW_UP,
    PROJECT_STATUS.WON,
    PROJECT_STATUS.LOST,
  ],
  [PROJECT_STATUS.LOST]: [PROJECT_STATUS.FOLLOW_UP], // lost 可回 follow_up
  [PROJECT_STATUS.WON]: [], // won 为终态
};

/**
 * 校验状态流转是否合法
 */
export function canTransitionStatus(
  from: string,
  to: string
): boolean {
  return (STATUS_TRANSITIONS[from as ProjectStatus] ?? []).includes(
    to as ProjectStatus
  );
}

/**
 * 判断项目是否已结束(获单/失单),用于停止预警
 */
export function isProjectEnded(status: string | null): boolean {
  return (
    status === PROJECT_STATUS.WON || status === PROJECT_STATUS.LOST
  );
}

/**
 * 获取租户项目列表(按询盘时间倒序)
 *
 * @param tenantId 租户 ID
 * @returns 项目列表
 */
export async function getProjectsByTenant(tenantId: string) {
  return db
    .select()
    .from(projects)
    .where(eq(projects.tenantId, tenantId))
    .orderBy(projects.inquiryDatetime);
}

/**
 * 更新项目状态(含流转校验与租户归属校验)
 *
 * @param projectId 项目 ID
 * @param tenantId 租户 ID
 * @param newStatus 目标状态
 * @throws 状态非法/无权访问/不存在时抛出错误
 */
export async function updateProjectStatus(
  projectId: string,
  tenantId: string,
  newStatus: string
): Promise<void> {
  // 校验目标状态合法
  if (!Object.values(PROJECT_STATUS).includes(newStatus as ProjectStatus)) {
    throw new Error(`Invalid project status: ${newStatus}`);
  }

  // 查询项目(含租户归属校验)
  const rows = await db
    .select()
    .from(projects)
    .where(
      and(eq(projects.id, projectId), eq(projects.tenantId, tenantId))
    )
    .limit(1);

  if (rows.length === 0) {
    throw new Error("Project not found or access denied");
  }

  const current = rows[0].projectStatus;
  if (!canTransitionStatus(current, newStatus)) {
    throw new Error(
      `Cannot change status from "${current}" to "${newStatus}"`
    );
  }

  await db
    .update(projects)
    .set({ projectStatus: newStatus })
    .where(eq(projects.id, projectId));
}
