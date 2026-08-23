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

// Dashboard 数据库模块 - 刷新持续时间 API(Phase 4 收尾)
// POST 遍历所有项目，重新计算持续时间/超3天标记，用于修复因数据迁移导致的时间字段不准确问题
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireTeamAccess } from "@/lib/rbac";
import { computeDuration } from "@/lib/dashboard/warning";

export async function POST() {
  try {
    const { teamId } = await requireTeamAccess();

    // 获取该租户(团队)下所有项目
    const allProjects = await db
      .select({
        id: projects.id,
        inquiryDatetime: projects.inquiryDatetime,
        durationHours: projects.durationHours,
        over3Days: projects.over3Days,
      })
      .from(projects)
      .where(eq(projects.tenantId, teamId));

    let fixedCount = 0;
    const now = new Date();

    for (const p of allProjects) {
      if (!p.inquiryDatetime) continue;

      const { durationHours, over3Days } = computeDuration(p.inquiryDatetime, now);
      const newDuration = durationHours !== null ? String(durationHours) : null;

      // 只有发生变化时才更新
      if (p.durationHours !== newDuration || p.over3Days !== over3Days) {
        await db
          .update(projects)
          .set({ durationHours: newDuration, over3Days })
          .where(and(eq(projects.id, p.id), eq(projects.tenantId, teamId)));
        fixedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      total: allProjects.length,
      fixed: fixedCount,
      message: `已检查 ${allProjects.length} 个项目，修正了 ${fixedCount} 个项目的持续时间`,
    });
  } catch (error) {
    console.error("刷新持续时间失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "刷新持续时间失败" },
      { status: 500 }
    );
  }
}