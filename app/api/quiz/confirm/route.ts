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

// 销售经理确认回复 API(Phase 3 Task 3.9)
//
// GET: 根据 project 参数返回确认页面数据(公开访问,由邮件中的链接携带)
// POST: 记录确认时间到项目回复日期(AC-07)
//
// 说明:确认链接含不可猜测 token(Phase 2 已实现 generateConfirmUrl),
// MVP 阶段 token 不落库,页面凭 project 编号确认

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getConfirmReplyData,
  confirmProjectReply,
} from "@/lib/dashboard/confirm-reply";

const projectQuerySchema = z.object({
  project: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const project = request.nextUrl.searchParams.get("project");
    const parsed = projectQuerySchema.safeParse({ project: project ?? "" });

    if (!parsed.success) {
      return NextResponse.json({ error: "Missing project number parameter" }, { status: 400 });
    }

    const data = await getConfirmReplyData(parsed.data.project);
    if (!data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("quiz confirm GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve confirmation info" },
      { status: 500 }
    );
  }
}

const confirmSchema = z.object({
  project: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = confirmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Missing project number parameter" },
        { status: 400 }
      );
    }

    const success = await confirmProjectReply(parsed.data.project);
    if (!success) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Reply confirmed successfully" });
  } catch (error) {
    console.error("quiz confirm POST error:", error);
    return NextResponse.json(
      { error: "Failed to record confirmation, please try again" },
      { status: 500 }
    );
  }
}
