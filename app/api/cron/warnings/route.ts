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

// 预警定时任务 API(Phase 3 Task 3.10)
//
// POST: 遍历所有租户,检查项目持续时间并触发黄色/红色预警邮件
// 触发方式:Vercel Cron(vercel.json 配置),或本地手动调用
//
// 判断规则(需求 2.2.3.16/2.2.3.18):
// 1. 先判断项目是否超过 3 天,超过则不触发
// 2. >=黄色阈值(默认24h) 触发黄色预警
// 3. >=红色阈值(默认48h) 触发红色预警
// 4. 项目已结束(获单/失单)不再预警
//
// 鉴权:通过 Authorization: Bearer <CRON_SECRET> 保护

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { processTenantWarnings } from "@/lib/dashboard/warning";

export async function POST(request: NextRequest) {
  // 校验 Cron 密钥(未配置 CRON_SECRET 时开发环境放行)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (
    cronSecret &&
    authHeader !== `Bearer ${cronSecret}` &&
    process.env.NODE_ENV !== "development"
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 遍历所有租户(每个 user 即一个租户)
    const tenants = await db.select({ id: user.id }).from(user);

    const allTriggered: {
      projectId: string;
      projectNumber: string;
      level: string;
    }[] = [];

    for (const tenant of tenants) {
      const triggered = await processTenantWarnings(tenant.id);
      allTriggered.push(...triggered);
    }

    return NextResponse.json({
      success: true,
      tenants: tenants.length,
      triggered: allTriggered,
    });
  } catch (error) {
    console.error("cron warnings 错误:", error);
    return NextResponse.json(
      { error: "预警处理失败" },
      { status: 500 }
    );
  }
}
