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

// Dashboard 数据库模块 - 审计日志查询 API(Phase 4,AC-13)
//
// 功能:查询当前用户的审计日志(最近 50 条)
// 访控:需登录 + Dashboard 权限

import { NextRequest, NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/rbac";
import { getAuditLogs } from "@/lib/dashboard/audit-log";

export async function GET(request: NextRequest) {
  try {
    const user = await requireDashboardAccess();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const logs = await getAuditLogs(user.id, { limit, offset });

    return NextResponse.json({ logs, count: logs.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      { status: 500 }
    );
  }
}