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

// 询盘次数限制检查 API(Phase 3 Task 3.7)
//
// GET: 客户访问 Quiz 前检查今日询盘次数是否已达上限
// 返回 isLimited: true 时前端显示"今日询盘次数已达上限,请明日再试"
//
// 说明:公开接口(客户访问 Quiz 时无需登录),
// 通过 header x-tenant-id 标识销售方租户(MVP 简化,生产应通过子域名识别)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getInquiryLimitStatusForTenant } from "@/lib/dashboard/inquiry-limit";

const querySchema = z.object({
  tenantId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.nextUrl.searchParams.get("tenantId");
    const parsed = querySchema.safeParse({ tenantId: tenantId ?? "" });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "缺少 tenantId 参数" },
        { status: 400 }
      );
    }

    const status = await getInquiryLimitStatusForTenant(parsed.data.tenantId);
    return NextResponse.json({ ...status });
  } catch (error) {
    console.error("quiz limit 错误:", error);
    return NextResponse.json(
      { error: "查询询盘次数失败" },
      { status: 500 }
    );
  }
}
