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

// 团队管理逻辑(Phase 3 Task 3.5 + 验收修订 2.1.7.5/2.1.8.1)
//
// 功能:
// - 销售经理列表(role = sales_manager 的用户)
// - 添加/删除销售经理(调整 user.role)
// - 销售总监设置(role = sales_director,询盘/预警邮件抄送对象)
// - 主题-销售经理关联(经理可负责多个主题,一个主题一个负责人)
//
// 团队隔离:所有查询以 teamId(= tenant_id = 团队管理员 userId)过滤,
// 仅统计/操作本团队成员,跨团队数据不可见
//
// MVP 说明:销售经理/总监为独立用户记录(role 区分),
// 项目通过 manager_id 关联到经理;主题-经理关联存储于 quiz_edges/quiz_nodes

import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { user, quizEdges, quizNodes, USER_ROLES } from "@/lib/db/schema";
import { decrypt, encrypt, isEncryptionEnabled } from "@/lib/crypto";
import { getTeamStaffUserIds, assertTeamStaff } from "@/lib/teams";

// 销售经理信息
export type SalesManagerInfo = {
  id: string;
  name: string;
  email: string;
  /** 电话(解密后,未配置加密时为空) */
  phone: string | null;
};

// 销售总监信息
export type SalesDirectorInfo = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
} | null;

// 主题-经理关联信息
export type ThemeAssignment = {
  theme: string;
  managerId: string | null;
  managerName: string | null;
  // 关联到的边/节点数量(用于界面展示影响范围)
  edgeCount: number;
};

/**
 * 解密手机号(失败或未配置加密时返回 null,不阻塞展示)
 */
function safeDecryptPhone(encryptedPhone: string | null): string | null {
  if (!encryptedPhone || !isEncryptionEnabled()) {
    return encryptedPhone ?? null;
  }
  try {
    return decrypt(encryptedPhone);
  } catch {
    return null;
  }
}

/**
 * 获取团队销售经理列表(团队内 role = sales_manager 的成员,含电话)
 */
export async function listSalesManagers(teamId: string): Promise<SalesManagerInfo[]> {
  const staffIds = await getTeamStaffUserIds(teamId);
  if (staffIds.length === 0) {
    return [];
  }
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    })
    .from(user)
    .where(and(eq(user.role, USER_ROLES.SALES_MANAGER), inArray(user.id, staffIds)))
    .orderBy(user.name);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: safeDecryptPhone(r.phone),
  }));
}

/**
 * 添加销售经理:将指定邮箱的团队成员提升为销售经理
 *
 * @param email 用户邮箱(必须是本团队成员)
 * @param teamId 团队 ID
 * @throws 用户不存在或不是本团队成员时抛出错误
 */
export async function addSalesManager(
  email: string,
  teamId: string
): Promise<SalesManagerInfo> {
  const trimmed = email.trim().toLowerCase();
  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email, phone: user.phone })
    .from(user)
    .where(eq(user.email, trimmed))
    .limit(1);

  if (rows.length === 0) {
    throw new Error(`用户不存在: ${trimmed},请先让该用户注册`);
  }

  // 仅可添加本团队成员为销售经理(团队隔离)
  await assertTeamStaff(rows[0].id, teamId);

  await db
    .update(user)
    .set({ role: USER_ROLES.SALES_MANAGER })
    .where(eq(user.id, rows[0].id));

  return {
    id: rows[0].id,
    name: rows[0].name,
    email: rows[0].email,
    phone: safeDecryptPhone(rows[0].phone),
  };
}

/**
 * 删除销售经理:将角色恢复为普通用户(仅限本团队成员)
 *
 * @param userId 用户 ID
 * @param teamId 团队 ID
 */
export async function removeSalesManager(
  userId: string,
  teamId: string
): Promise<void> {
  // 仅可移除本团队的销售经理(团队隔离)
  await assertTeamStaff(userId, teamId);
  await db
    .update(user)
    .set({ role: USER_ROLES.USER })
    .where(
      and(eq(user.id, userId), eq(user.role, USER_ROLES.SALES_MANAGER))
    );
}

/**
 * 获取租户模板的主题-经理关联列表
 *
 * 汇总所有 P3 选项的 result_theme,并展示当前关联的经理
 *
 * @param templateId Quiz 模板 ID
 */
export async function getThemeAssignments(
  templateId: string
): Promise<ThemeAssignment[]> {
  // 查询该模板下所有 P3 节点
  const p3Nodes = await db
    .select({ id: quizNodes.id })
    .from(quizNodes)
    .where(
      and(eq(quizNodes.templateId, templateId), eq(quizNodes.level, "P3"))
    );

  const p3NodeIds = p3Nodes.map((n) => n.id);
  if (p3NodeIds.length === 0) {
    return [];
  }

  // 查询该模板 P3 节点下的全部选项(边),在 JS 中过滤有主题的
  const edges = await db
    .select({
      id: quizEdges.id,
      resultTheme: quizEdges.resultTheme,
      resultManagerId: quizEdges.resultManagerId,
    })
    .from(quizEdges)
    .where(inArray(quizEdges.nodeId, p3NodeIds));

  // 按主题聚合
  const themeMap = new Map<string, { managerId: string | null; edgeCount: number }>();
  for (const edge of edges) {
    if (!edge.resultTheme) {
      continue;
    }
    const entry = themeMap.get(edge.resultTheme) ?? {
      managerId: edge.resultManagerId,
      edgeCount: 0,
    };
    entry.edgeCount += 1;
    // 有经理关联时更新(选项级 > 节点级,此处取选项级)
    if (edge.resultManagerId) {
      entry.managerId = edge.resultManagerId;
    }
    themeMap.set(edge.resultTheme, entry);
  }

  // 查询经理姓名(逐个查询,经理数量少可接受)
  const managerIds = Array.from(themeMap.values())
    .map((v) => v.managerId)
    .filter((id): id is string => Boolean(id));
  const managerNameById = new Map<string, string>();
  for (const id of managerIds) {
    const rows = await db
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    if (rows.length > 0) {
      managerNameById.set(id, rows[0].name);
    }
  }

  return Array.from(themeMap.entries()).map(([theme, value]) => ({
    theme,
    managerId: value.managerId,
    managerName: value.managerId ? (managerNameById.get(value.managerId) ?? null) : null,
    edgeCount: value.edgeCount,
  }));
}

/**
 * 更新主题-经理关联(将该主题下所有 P3 选项的 result_manager_id 一并更新)
 *
 * @param templateId Quiz 模板 ID
 * @param theme 主题名
 * @param managerId 销售经理 ID(传 null 解除关联)
 */
export async function updateThemeManager(
  templateId: string,
  theme: string,
  managerId: string | null
): Promise<void> {
  // 查询该模板下所有 P3 节点 id
  const p3Nodes = await db
    .select({ id: quizNodes.id })
    .from(quizNodes)
    .where(
      and(eq(quizNodes.templateId, templateId), eq(quizNodes.level, "P3"))
    );
  const p3NodeIds = p3Nodes.map((n) => n.id);

  // 更新这些节点下匹配主题的选项
  if (p3NodeIds.length > 0) {
    for (const nodeId of p3NodeIds) {
      await db
        .update(quizEdges)
        .set({ resultManagerId: managerId })
        .where(
          and(
            eq(quizEdges.nodeId, nodeId),
            eq(quizEdges.resultTheme, theme)
          )
        );
    }
  }
}

// ==================== 销售总监(验收修订 2.1.7.5/2.1.8.1) ====================

/**
 * 获取团队销售总监(is_director = true 或 role = sales_director,每团队仅一位)
 *
 * 说明:销售总监与销售经理可为同一人(is_director 标记与 role 不互斥)
 *
 * @param teamId 团队 ID(= tenant_id)
 */
export async function getSalesDirector(teamId: string): Promise<SalesDirectorInfo> {
  const staffIds = await getTeamStaffUserIds(teamId);
  if (staffIds.length === 0) {
    return null;
  }

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    })
    .from(user)
    .where(and(eq(user.isDirector, true), inArray(user.id, staffIds)))
    .limit(1);

  if (rows.length === 0) {
    // 兼容旧数据:团队内 role = sales_director 的用户视为总监
    const legacy = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      })
      .from(user)
      .where(and(eq(user.role, USER_ROLES.SALES_DIRECTOR), inArray(user.id, staffIds)))
      .limit(1);
    if (legacy.length === 0) {
      return null;
    }
    return {
      id: legacy[0].id,
      name: legacy[0].name,
      email: legacy[0].email,
      phone: safeDecryptPhone(legacy[0].phone),
    };
  }

  return {
    id: rows[0].id,
    name: rows[0].name,
    email: rows[0].email,
    phone: safeDecryptPhone(rows[0].phone),
  };
}

/**
 * 设置团队销售总监:将指定团队成员标记为总监(is_director = true)
 *
 * 与销售经理角色不互斥:用户可同时是销售经理与销售总监(验收修订 2.1.7.5)
 * 仅清除本团队其他成员的总监标记,不影响其他团队
 *
 * @param userId 用户 ID(必须是本团队成员)
 * @param teamId 团队 ID
 * @throws 用户不存在或不是本团队成员时抛出错误
 */
export async function setSalesDirector(
  userId: string,
  teamId: string
): Promise<SalesManagerInfo> {
  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email, phone: user.phone })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (rows.length === 0) {
    throw new Error("用户不存在");
  }

  // 仅可指定本团队成员为总监(团队隔离)
  await assertTeamStaff(userId, teamId);

  const staffIds = await getTeamStaffUserIds(teamId);

  await db.transaction(async (tx) => {
    // 清除本团队其他成员的总监标记(不影响其他团队)
    await tx
      .update(user)
      .set({ isDirector: false })
      .where(and(eq(user.isDirector, true), inArray(user.id, staffIds)));
    // 标记目标用户为总监
    await tx
      .update(user)
      .set({ isDirector: true })
      .where(eq(user.id, userId));
  });

  return {
    id: rows[0].id,
    name: rows[0].name,
    email: rows[0].email,
    phone: safeDecryptPhone(rows[0].phone),
  };
}

/**
 * 更新用户电话(加密存储,验收修订 2.1.7.5:补充销售经理/总监电话输入框)
 *
 * @param userId 用户 ID
 * @param phone 明文电话
 */
export async function updateUserPhone(
  userId: string,
  phone: string
): Promise<void> {
  const encryptedPhone = isEncryptionEnabled() ? encrypt(phone) : phone;
  await db
    .update(user)
    .set({ phone: encryptedPhone })
    .where(eq(user.id, userId));
}

/**
 * 获取模板的全部主题(P3 选项的 result_theme 去重)
 */
export async function listTemplateThemes(templateId: string): Promise<string[]> {
  const p3Nodes = await db
    .select({ id: quizNodes.id })
    .from(quizNodes)
    .where(
      and(eq(quizNodes.templateId, templateId), eq(quizNodes.level, "P3"))
    );
  const p3NodeIds = p3Nodes.map((n) => n.id);
  if (p3NodeIds.length === 0) {
    return [];
  }

  const edges = await db
    .select({ resultTheme: quizEdges.resultTheme })
    .from(quizEdges)
    .where(inArray(quizEdges.nodeId, p3NodeIds));

  const themes = Array.from(
    new Set(
      edges
        .map((e) => e.resultTheme)
        .filter((t): t is string => t != null && t.trim() !== "")
    )
  );
  return themes;
}

/**
 * 获取指定销售经理负责的主题列表(用于界面多选回显)
 */
export async function getManagerThemes(
  managerId: string,
  templateId: string
): Promise<string[]> {
  const p3Nodes = await db
    .select({ id: quizNodes.id })
    .from(quizNodes)
    .where(
      and(eq(quizNodes.templateId, templateId), eq(quizNodes.level, "P3"))
    );
  const p3NodeIds = p3Nodes.map((n) => n.id);
  if (p3NodeIds.length === 0) {
    return [];
  }

  const edges = await db
    .select({ resultTheme: quizEdges.resultTheme })
    .from(quizEdges)
    .where(
      and(inArray(quizEdges.nodeId, p3NodeIds), eq(quizEdges.resultManagerId, managerId))
    );

  return Array.from(
    new Set(
      edges
        .map((e) => e.resultTheme)
        .filter((t): t is string => t != null && t.trim() !== "")
    )
  );
}

/**
 * 更新销售经理负责的主题集合(经理可负责多个主题,验收 2.1.7.5)
 *
 * 逻辑:
 * 1. 对选中主题:将该主题下所有 P3 选项的 result_manager_id 设为该经理
 * 2. 对"该经理原负责但本次未选中"的主题:清除其负责人
 *
 * @param managerId 销售经理 ID
 * @param templateId Quiz 模板 ID
 * @param themes 该经理负责的主题数组
 */
export async function updateManagerThemes(
  managerId: string,
  templateId: string,
  themes: string[]
): Promise<void> {
  const allThemes = await listTemplateThemes(templateId);
  const selected = new Set(themes);

  // 该经理原负责的主题
  const current = new Set(await getManagerThemes(managerId, templateId));

  // 逐一处理:选中的设置负责人;原负责但未选中的清除负责人
  for (const theme of allThemes) {
    if (selected.has(theme)) {
      await updateThemeManager(templateId, theme, managerId);
    } else if (current.has(theme)) {
      await updateThemeManager(templateId, theme, null);
    }
  }
}
