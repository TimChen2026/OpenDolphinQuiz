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

// Dashboard 预警设置管理(Phase 3 Task 3.6)
//
// 功能:
// - 获取租户预警设置(黄色/红色阈值小时数),不存在时创建默认值(24h/48h)
// - 更新预警设置
//
// 说明:黄色预警默认 24h,红色预警默认 48h(需求 2.1.7.6)

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { warningSettings } from "@/lib/db/schema";

// 默认预警阈值(小时)
export const DEFAULT_YELLOW_HOURS = 24;
export const DEFAULT_RED_HOURS = 48;

// 预警设置数据
export type WarningSettingsData = {
  yellowHours: number;
  redHours: number;
};

/**
 * 获取租户预警设置
 *
 * 首次访问时自动创建默认设置(黄 24h / 红 48h),保证接口幂等
 *
 * @param tenantId 租户 ID
 * @returns 预警设置
 */
export async function getWarningSettingsByTenant(
  tenantId: string
): Promise<WarningSettingsData> {
  const rows = await db
    .select()
    .from(warningSettings)
    .where(eq(warningSettings.tenantId, tenantId))
    .limit(1);

  if (rows.length > 0) {
    return {
      yellowHours: rows[0].yellowHours,
      redHours: rows[0].redHours,
    };
  }

  // 不存在则创建默认设置
  await db.insert(warningSettings).values({
    id: crypto.randomUUID(),
    tenantId,
    yellowHours: DEFAULT_YELLOW_HOURS,
    redHours: DEFAULT_RED_HOURS,
  });

  return { yellowHours: DEFAULT_YELLOW_HOURS, redHours: DEFAULT_RED_HOURS };
}

/**
 * 更新租户预警设置
 *
 * @param tenantId 租户 ID
 * @param yellowHours 黄色预警阈值(小时,>=1)
 * @param redHours 红色预警阈值(小时,>黄色阈值)
 * @throws 参数非法时抛出错误
 */
export async function updateWarningSettingsByTenant(
  tenantId: string,
  yellowHours: number,
  redHours: number
): Promise<void> {
  // 参数校验(数据边界校验输入)
  if (!Number.isInteger(yellowHours) || yellowHours < 1) {
    throw new Error(`黄色预警阈值非法: ${yellowHours}`);
  }
  if (!Number.isInteger(redHours) || redHours <= yellowHours) {
    throw new Error(`红色预警阈值非法: ${redHours}(须大于黄色阈值 ${yellowHours})`);
  }

  const rows = await db
    .select({ id: warningSettings.id })
    .from(warningSettings)
    .where(eq(warningSettings.tenantId, tenantId))
    .limit(1);

  if (rows.length > 0) {
    await db
      .update(warningSettings)
      .set({ yellowHours, redHours })
      .where(eq(warningSettings.id, rows[0].id));
  } else {
    await db.insert(warningSettings).values({
      id: crypto.randomUUID(),
      tenantId,
      yellowHours,
      redHours,
    });
  }
}
