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
// 遍历所有租户,检查项目持续时间并触发黄色/红色预警邮件
// 触发方式:cron-job.org 外部定时服务(默认发 GET 请求),或本地手动调用
//
// 判断规则(需求 2.2.3.16/2.2.3.18):
// 1. 先判断项目是否超过 3 天,超过则不触发
// 2. >=黄色阈值(默认24h) 触发黄色预警
// 3. >=红色阈值(默认48h) 触发红色预警
// 4. 项目已结束(获单/失单)不再预警
//
// 鉴权:通过 Authorization: Bearer <CRON_SECRET> 保护
// 注意:必须同时支持 GET 与 POST——外部定时服务与手动调用可能使用任一方法,
// 此前仅支持 POST 导致 Vercel Cron 的 GET 调用全部返回 405,预警从未执行过

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { team } from "@/lib/db/schema";
import { processTenantWarnings } from "@/lib/dashboard/warning";

async function handleCronWarnings(request: NextRequest) {
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
    // 遍历所有租户(团队模型:每个团队即一个租户,tenant_id = team.id)
    const tenants = await db.select({ id: team.id }).from(team);

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

export async function GET(request: NextRequest) {
  return handleCronWarnings(request);
}

export async function POST(request: NextRequest) {
  return handleCronWarnings(request);
}
