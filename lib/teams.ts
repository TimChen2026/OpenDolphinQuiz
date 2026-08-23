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
 * but WITHOUT ANY WARRANTY; without even implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// 团队(Team)管理核心逻辑
//
// 模型说明:
// - team.id 复用创建者(团队管理员)的 userId,既有 tenant_id 数据无需迁移即归属团队
// - 团队成员(member):一个邮箱(账号)仅属于一个团队,注册时输入团队名加入或创建
// - 客户(customer):通过问卷链接注册/访问,自动归属问卷所属团队,可属于多个团队
// - 每个团队第一个加入的用户为团队管理员(team_member.role = admin)

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { user, team, teamMember, TEAM_MEMBER_ROLES, ACCOUNT_TYPES } from "@/lib/db/schema";

// 超级管理员所属团队名(需求:超级管理员 Tim 属于 Testing 团队)
export const SUPER_ADMIN_TEAM_NAME = "Testing";

/**
 * 生成新 ID(与项目现有做法一致,使用 crypto.randomUUID)
 */
function newId(): string {
  return crypto.randomUUID();
}

/**
 * 查询用户账号类型
 */
async function getAccountType(userId: string): Promise<string> {
  const rows = await db
    .select({ accountType: user.accountType })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return rows[0]?.accountType ?? ACCOUNT_TYPES.MEMBER;
}

/**
 * 按团队名查询团队
 */
export async function findTeamByName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }
  const rows = await db
    .select()
    .from(team)
    .where(eq(team.name, trimmed))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * 用户注册时加入团队(团队成员流程)
 *
 * 规则:
 * - 团队名已存在:加入该团队,角色为普通成员(member)
 * - 团队名不存在:创建新团队(id = 当前用户 id),当前用户为团队管理员(admin)
 *
 * @param userId 当前注册用户 ID
 * @param teamName 注册表单输入的团队/公司名称
 * @returns 加入的团队信息
 */
export async function joinTeamByName(userId: string, teamName: string) {
  const trimmed = teamName.trim();
  if (!trimmed) {
    throw new Error("团队/公司名称不能为空");
  }

  const existing = await findTeamByName(trimmed);
  if (existing) {
    await db
      .insert(teamMember)
      .values({
        id: newId(),
        teamId: existing.id,
        userId,
        role: TEAM_MEMBER_ROLES.MEMBER,
      })
      .onConflictDoNothing();
    return existing;
  }

  // 新团队:第一个加入的用户即管理员,团队 id 复用其 userId
  // 并发注册同名团队时靠 name 唯一约束兜底:冲突后重查加入已有团队
  try {
    await db.insert(team).values({ id: userId, name: trimmed });
  } catch {
    const raced = await findTeamByName(trimmed);
    if (raced) {
      await db
        .insert(teamMember)
        .values({
          id: newId(),
          teamId: raced.id,
          userId,
          role: TEAM_MEMBER_ROLES.MEMBER,
        })
        .onConflictDoNothing();
      return raced;
    }
    throw new Error("创建团队失败");
  }

  await db.insert(teamMember).values({
    id: newId(),
    teamId: userId,
    userId,
    role: TEAM_MEMBER_ROLES.ADMIN,
  });
  return { id: userId, name: trimmed, createdAt: new Date() };
}

/**
 * 客户归属团队(客户流程)
 *
 * 客户通过问卷链接访问,自动加入问卷所属团队;已属于该团队时幂等跳过。
 * 客户(accountType=customer)可属于多个团队。
 *
 * @param userId 客户用户 ID
 * @param teamId 问卷所属团队 ID(= 模板 tenantId)
 */
export async function joinTeamAsCustomer(userId: string, teamId: string) {
  await db
    .insert(teamMember)
    .values({
      id: newId(),
      teamId,
      userId,
      role: TEAM_MEMBER_ROLES.CUSTOMER,
    })
    .onConflictDoNothing();
}

/**
 * 将用户标记为客户账号(通过问卷页注册/登录的用户)
 */
export async function markUserAsCustomer(userId: string) {
  await db
    .update(user)
    .set({ accountType: ACCOUNT_TYPES.CUSTOMER })
    .where(and(eq(user.id, userId), eq(user.accountType, ACCOUNT_TYPES.MEMBER)));
}

/**
 * 解析用户的团队 ID
 *
 * - 团队成员:返回其所属团队的 id
 * - 客户:返回 null(客户可属多个团队,无单一团队上下文)
 * - 存量用户(升级前注册,无 team_member 记录):惰性迁移——
 *   自动创建以用户名命名的团队并成为管理员;超级管理员归入 Testing 团队
 *
 * @returns 团队 ID,客户或解析失败时返回 null
 */
export async function resolveUserTeamId(userInfo: {
  id: string;
  name: string;
  email: string;
  /** 调用方已知的账号类型,避免重复查询 user 表 */
  accountType?: string;
}): Promise<string | null> {
  // 客户无单一团队上下文
  const accountType = userInfo.accountType ?? (await getAccountType(userInfo.id));
  if (accountType === ACCOUNT_TYPES.CUSTOMER) {
    return null;
  }

  // 已有团队记录:返回所属团队
  const memberships = await db
    .select({ teamId: teamMember.teamId })
    .from(teamMember)
    .where(eq(teamMember.userId, userInfo.id))
    .limit(1);
  if (memberships.length > 0) {
    return memberships[0].teamId;
  }

  // 惰性迁移存量用户:创建团队并成为管理员
  const isSuperAdmin =
    userInfo.email.trim().toLowerCase() ===
    process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const teamName = isSuperAdmin ? SUPER_ADMIN_TEAM_NAME : userInfo.name;

  // 团队名唯一约束冲突(重名用户)时追加后缀重试一次
  let finalName = teamName;
  if (await findTeamByName(finalName)) {
    finalName = `${teamName}-${userInfo.id.slice(0, 8)}`;
  }

  await db
    .insert(team)
    .values({ id: userInfo.id, name: finalName })
    .onConflictDoNothing();
  await db
    .insert(teamMember)
    .values({
      id: newId(),
      teamId: userInfo.id,
      userId: userInfo.id,
      role: TEAM_MEMBER_ROLES.ADMIN,
    })
    .onConflictDoNothing();

  return userInfo.id;
}

/**
 * 获取团队全部成员的用户 ID(含客户,用于范围过滤)
 */
export async function getTeamMemberUserIds(teamId: string): Promise<string[]> {
  const rows = await db
    .select({ userId: teamMember.userId })
    .from(teamMember)
    .where(eq(teamMember.teamId, teamId));
  return rows.map((r) => r.userId);
}

/**
 * 获取团队的非客户成员用户 ID(团队成员,用于总监/经理范围过滤)
 */
export async function getTeamStaffUserIds(teamId: string): Promise<string[]> {
  const rows = await db
    .select({ userId: teamMember.userId })
    .from(teamMember)
    .where(
      and(
        eq(teamMember.teamId, teamId),
        inArray(teamMember.role, [TEAM_MEMBER_ROLES.ADMIN, TEAM_MEMBER_ROLES.MEMBER])
      )
    );
  return rows.map((r) => r.userId);
}

/**
 * 校验用户是否为团队成员(非客户),不是时抛出异常
 */
export async function assertTeamStaff(userId: string, teamId: string) {
  const rows = await db
    .select({ role: teamMember.role })
    .from(teamMember)
    .where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
    .limit(1);
  const role = rows[0]?.role;
  if (role !== TEAM_MEMBER_ROLES.ADMIN && role !== TEAM_MEMBER_ROLES.MEMBER) {
    throw new Error("该用户不是本团队成员");
  }
}

/**
 * 获取团队套餐(plan)
 *
 * 团队套餐 = 团队管理员(user.id = team.id)的 plan,
 * 管理后台修改管理员套餐即修改整个团队的套餐
 */
export async function getTeamPlan(teamId: string): Promise<string> {
  const rows = await db
    .select({ plan: user.plan })
    .from(user)
    .where(eq(user.id, teamId))
    .limit(1);
  return rows[0]?.plan ?? "free";
}

/**
 * 获取团队管理员邮箱(用于询盘上限提示邮件收件人)
 */
export async function getTeamAdminEmail(teamId: string): Promise<string | null> {
  const rows = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, teamId))
    .limit(1);
  return rows[0]?.email ?? null;
}

/**
 * 获取团队名称
 */
export async function getTeamName(teamId: string): Promise<string | null> {
  const rows = await db
    .select({ name: team.name })
    .from(team)
    .where(eq(team.id, teamId))
    .limit(1);
  return rows[0]?.name ?? null;
}
