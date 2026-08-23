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

// Dashboard 分析模块 API(Phase 5,AC-15)
//
// 功能:返回分析图表数据
// 参数:chart=1~10, 默认仅 chart 1 对免费用户可见
// 访控:需登录 + Dashboard 权限

import { NextRequest, NextResponse } from "next/server";
import { requireTeamAccess } from "@/lib/rbac";
import { getProjectsByTenant } from "@/lib/dashboard/project-status";
import { computeChartData } from "@/lib/dashboard/analysis";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import type { DashboardProject } from "@/features/dashboard/types";

/** 将 Drizzle 行数据转换为 DashboardProject 类型(日期转字符串) */
function toDashboardProject(row: Awaited<ReturnType<typeof getProjectsByTenant>>[number]): DashboardProject {
  return {
    id: row.id,
    projectNumber: row.projectNumber,
    customerName: row.customerName,
    theme: row.theme,
    phone: row.phone,
    email: row.email,
    inquiryDatetime: row.inquiryDatetime?.toISOString() ?? null,
    replyDatetime: row.replyDatetime?.toISOString() ?? null,
    projectStatus: row.projectStatus,
    durationHours: row.durationHours,
    over3Days: row.over3Days,
    warningYellowAt: row.warningYellowAt?.toISOString() ?? null,
    warningRedAt: row.warningRedAt?.toISOString() ?? null,
    notificationTime: row.notificationTime?.toISOString() ?? null,
    notes: row.notes,
    managerId: row.managerId,
    intervalHours: row.intervalHours,
    projectAmount: row.projectAmount,
  };
}

/** 获取所有经理 ID 到姓名的映射 */
async function getManagerNameMap(projects: DashboardProject[]): Promise<Map<string, string>> {
  const managerIds = Array.from(new Set(projects.map((p) => p.managerId).filter(Boolean)));
  if (managerIds.length === 0) return new Map();

  const managers = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(inArray(user.id, managerIds as string[]));

  const map = new Map<string, string>();
  for (const m of managers) {
    map.set(m.id, m.name);
  }
  return map;
}

/** 将数据中的 managerId 替换为经理姓名 */
function resolveManagerNames(data: unknown, nameMap: Map<string, string>): unknown {
  if (Array.isArray(data)) {
    return data.map((item: Record<string, unknown>) => {
      if (item.managerName && nameMap.has(item.managerName as string)) {
        return { ...item, managerName: nameMap.get(item.managerName as string) };
      }
      return item;
    });
  }
  return data;
}

export async function GET(request: NextRequest) {
  try {
    // 1. 校验登录 + 团队权限(项目数据与套餐按团队隔离)
    const { teamId, teamPlan } = await requireTeamAccess();

    const { searchParams } = new URL(request.url);
    const chartParam = searchParams.get("chart");
    const chartNumber = chartParam ? parseInt(chartParam, 10) : 1;

    // 2. 图表权限:pro/max 团队套餐可查看全部图表,免费套餐仅 chart 1
    const isPro = teamPlan === "pro" || teamPlan === "max";
    if (!isPro && chartNumber > 1) {
      return NextResponse.json(
        {
          error:
            "当前套餐仅可查看基础图表,升级 Pro/Max 套餐可查看全部图表",
        },
        { status: 403 }
      );
    }

    // 3. 获取项目数据并转换类型(按团队过滤)
    const rawProjects = await getProjectsByTenant(teamId);
    const projects: DashboardProject[] = rawProjects.map(toDashboardProject);

    // 4. 调用聚合函数(AC-10:数据获取与聚合分离)
    const data = computeChartData(projects, chartNumber);

    // 5. 图表 8/9/10 包含经理姓名,需要将 managerId 解析为真实姓名
    if (chartNumber === 8 || chartNumber === 9 || chartNumber === 10) {
      const nameMap = await getManagerNameMap(projects);
      const resolvedData = resolveManagerNames(data, nameMap);
      return NextResponse.json({ chart: chartNumber, data: resolvedData });
    }

    return NextResponse.json({ chart: chartNumber, data });
  } catch (error) {
    console.error("analysis API 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "查询失败" },
      { status: 500 }
    );
  }
}