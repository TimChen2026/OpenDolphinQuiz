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

// Dashboard 数据库模块 - 备份 API(Phase 4,AC-12)
//
// 功能:触发数据库备份
// 说明:本 API 为 Vercel Cron 定时备份的触发接口,实际备份由 Neon 数据库管理
// 本端点记录备份请求到审计日志,并返回备份状态

import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/rbac";
import { logAudit } from "@/lib/dashboard/audit-log";

export async function POST(request: NextRequest) {
  try {
    // 1. 校验登录 + Dashboard 权限
    const user = await requireDashboardAccess();

    // 2. 记录审计日志
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? null;
    await logAudit({
      userId: user.id,
      actionType: "create",
      description: "触发数据库备份",
      ipAddress: ip,
    });

    // 3. 返回备份状态
    // 注意:实际备份由 Neon 自动管理,此端点仅用于触发和记录
    return NextResponse.json({
      success: true,
      message: "备份请求已记录,数据库由 Neon 自动管理每日备份",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("备份请求失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "备份请求失败" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await requireDashboardAccess();

    // 返回备份状态信息
    return NextResponse.json({
      success: true,
      note: "数据库由 Neon 自动管理每日全量备份",
      recommendation: "如需手动备份,请使用 Neon 控制台操作",
      lastBackup: null, // 实际应由 Neon API 查询
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "查询失败" },
      { status: 500 }
    );
  }
}