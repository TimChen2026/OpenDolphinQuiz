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

// 销售经理确认回复逻辑(Phase 3 Task 3.9)
//
// 功能(AC-07):
// - 销售经理点击邮件中的"确认"按钮 → 打开确认回复页面
// - 确认页面展示项目与经理信息
// - 记录确认时间到 projects 回复日期/时间/日期时间,并计算间隔时间
//
// 间隔时间(需求 2.2.3.17):回复日期时间 - 发起询盘日期时间,单位为小时

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, user } from "@/lib/db/schema";

// 确认页面所需数据
export type ConfirmReplyData = {
  projectNumber: string;
  customerName: string;
  theme: string | null;
  managerName: string | null;
  tenantName: string | null;
  inquiryDatetime: Date;
  alreadyConfirmed: boolean;
};

/**
 * 查询项目与经理/租户信息(供确认页面展示)
 *
 * 按 project_number 查询(全局唯一约束)
 *
 * @param projectNumber 项目编号
 * @returns 确认页面数据,项目不存在时返回 null
 */
export async function getConfirmReplyData(
  projectNumber: string
): Promise<ConfirmReplyData | null> {
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.projectNumber, projectNumber))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }
  const project = rows[0];

  // 查询销售经理姓名
  let managerName: string | null = null;
  if (project.managerId) {
    const managers = await db
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, project.managerId))
      .limit(1);
    managerName = managers[0]?.name ?? null;
  }

  // 查询租户(用户)名称,用于确认页面署名
  const tenants = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, project.tenantId))
    .limit(1);
  const tenantName = tenants[0]?.name ?? null;

  return {
    projectNumber: project.projectNumber,
    customerName: project.customerName,
    theme: project.theme,
    managerName,
    tenantName,
    inquiryDatetime: project.inquiryDatetime,
    alreadyConfirmed: Boolean(project.replyDatetime),
  };
}

/**
 * 记录销售经理确认回复时间
 *
 * 更新字段:
 * - reply_datetime:确认时刻
 * - reply_date:确认日期(UTC)
 * - reply_time:确认时间(UTC)
 * - interval_hours:回复日期时间 - 询盘日期时间(小时)
 *
 * @param projectNumber 项目编号
 * @param now 确认时刻(便于测试)
 * @returns 是否成功(项目不存在返回 false)
 */
export async function confirmProjectReply(
  projectNumber: string,
  now: Date = new Date()
): Promise<boolean> {
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.projectNumber, projectNumber))
    .limit(1);

  if (rows.length === 0) {
    return false;
  }
  const project = rows[0];

  // 间隔时间(小时)= 回复时间 - 询盘时间
  const intervalMs = Math.max(0, now.getTime() - project.inquiryDatetime.getTime());
  const intervalHours = intervalMs / (1000 * 60 * 60);

  // 拆分 UTC 日期/时间
  const replyDate = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
  ].join("-");
  const replyTime = [
    String(now.getUTCHours()).padStart(2, "0"),
    String(now.getUTCMinutes()).padStart(2, "0"),
    String(now.getUTCSeconds()).padStart(2, "0"),
  ].join(":");

  await db
    .update(projects)
    .set({
      replyDatetime: now,
      replyDate,
      replyTime,
      // numeric 列以字符串存储
      intervalHours: String(intervalHours),
    })
    .where(eq(projects.id, project.id));

  return true;
}
