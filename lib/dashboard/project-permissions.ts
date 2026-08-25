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

// 项目看板查看权限(Phase 3 验收修订)
//
// 默认规则(同一团队内):
// - 管理员(团队创建者)/ 销售总监 / 超级管理员:可查看全部项目
// - 销售经理 / 普通成员:仅可查看自己跟踪的项目(manager_id = 自己)
// - 管理员可授权销售经理查看某个非自己跟踪的项目(project_permissions 表)
//
// 团队隔离:所有查询以 teamId(= tenant_id)过滤,跨团队数据不可见

import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  projects,
  user,
  teamMember,
  projectPermissions,
  USER_ROLES,
  TEAM_MEMBER_ROLES,
} from "@/lib/db/schema";
import { getProjectsByTenant } from "@/lib/dashboard/project-status";
import { isSuperAdminEmail } from "@/lib/rbac";

/** 项目看板查看者上下文(来自 requireTeamAccess 返回的用户) */
export type ProjectViewer = {
  id: string;
  role: string;
  isDirector: boolean;
  email: string;
};

/** 生成新 ID(与项目现有做法一致) */
function newId(): string {
  return crypto.randomUUID();
}

/**
 * 判断用户是否为团队管理员(团队创建者:team.id = 管理员 userId)
 */
export function isTeamAdminViewer(teamId: string, viewer: ProjectViewer): boolean {
  return viewer.id === teamId;
}

/**
 * 判断用户能否查看团队全部项目(管理员/销售总监/超级管理员)
 */
export function canViewAllProjects(
  teamId: string,
  viewer: ProjectViewer
): boolean {
  return (
    isSuperAdminEmail(viewer.email) ||
    isTeamAdminViewer(teamId, viewer) ||
    viewer.isDirector ||
    viewer.role === USER_ROLES.SALES_DIRECTOR
  );
}

/**
 * 获取项目看板可见项目列表(按角色过滤)
 *
 * - 管理员/销售总监/超级管理员:全部项目
 * - 销售经理/普通成员:自己跟踪的 + 被管理员授权的项目
 *
 * @param teamId 团队 ID
 * @param viewer 当前查看者
 */
export async function getVisibleProjectsByTenant(
  teamId: string,
  viewer: ProjectViewer
) {
  if (canViewAllProjects(teamId, viewer)) {
    return getProjectsByTenant(teamId);
  }

  // 非全量查看者:自己跟踪的项目 + 被授权的项目
  const authorized = await db
    .select({ projectId: projectPermissions.projectId })
    .from(projectPermissions)
    .where(
      and(
        eq(projectPermissions.tenantId, teamId),
        eq(projectPermissions.managerId, viewer.id)
      )
    );
  const authorizedIds = authorized.map((r) => r.projectId);

  return db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.tenantId, teamId),
        authorizedIds.length > 0
          ? or(
              eq(projects.managerId, viewer.id),
              inArray(projects.id, authorizedIds)
            )
          : eq(projects.managerId, viewer.id)
      )
    )
    .orderBy(projects.inquiryDatetime);
}

/**
 * 批量获取团队所有项目的授权经理 ID(模板 API 一次返回,避免逐项目查询)
 *
 * @returns Map<projectId, managerId[]>
 */
export async function listTeamProjectPermissions(
  teamId: string
): Promise<Map<string, string[]>> {
  const rows = await db
    .select({
      projectId: projectPermissions.projectId,
      managerId: projectPermissions.managerId,
    })
    .from(projectPermissions)
    .where(eq(projectPermissions.tenantId, teamId));

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const list = map.get(row.projectId) ?? [];
    list.push(row.managerId);
    map.set(row.projectId, list);
  }
  return map;
}

/**
 * 管理员授权销售经理查看指定项目
 *
 * 校验:
 * - 项目必须属于本团队(租户隔离)
 * - 被授权者必须是本团队销售经理(role = sales_manager)
 *
 * @param teamId 团队 ID
 * @param projectId 被授权项目 ID
 * @param managerId 被授权的销售经理用户 ID
 * @param grantedBy 授权人(团队管理员)用户 ID
 */
export async function grantProjectAccess(
  teamId: string,
  projectId: string,
  managerId: string,
  grantedBy: string
): Promise<void> {
  // 校验项目属于本团队
  const project = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.tenantId, teamId)))
    .limit(1);
  if (project.length === 0) {
    throw new Error("项目不存在或无权访问");
  }

  // 校验被授权者是本团队销售经理
  const manager = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.id, managerId))
    .limit(1);
  if (manager.length === 0 || manager[0].role !== USER_ROLES.SALES_MANAGER) {
    throw new Error("只能授权给销售经理");
  }
  const staff = await db
    .select({ userId: teamMember.userId })
    .from(teamMember)
    .where(
      and(
        eq(teamMember.teamId, teamId),
        eq(teamMember.userId, managerId),
        inArray(teamMember.role, [
          TEAM_MEMBER_ROLES.ADMIN,
          TEAM_MEMBER_ROLES.MEMBER,
        ])
      )
    )
    .limit(1);
  if (staff.length === 0) {
    throw new Error("该用户不是本团队成员");
  }

  // 幂等写入(唯一约束 projectId + managerId)
  await db
    .insert(projectPermissions)
    .values({ id: newId(), projectId, managerId, tenantId: teamId, grantedBy })
    .onConflictDoNothing();
}

/**
 * 管理员撤销对销售经理的项目查看授权
 */
export async function revokeProjectAccess(
  teamId: string,
  projectId: string,
  managerId: string
): Promise<void> {
  await db
    .delete(projectPermissions)
    .where(
      and(
        eq(projectPermissions.tenantId, teamId),
        eq(projectPermissions.projectId, projectId),
        eq(projectPermissions.managerId, managerId)
      )
    );
}
