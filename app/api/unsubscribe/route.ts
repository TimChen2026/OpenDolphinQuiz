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

// GDPR 退订 API(记录环节)
//
// GET /api/unsubscribe?token=<JWT>
// 用户从邮件中点击退订链接到达本接口:
// 1. 校验 Token 并提取邮箱(明文邮箱不出现在 URL 中)
// 2. 写入 unsubscribers 表(幂等,重复点击不报错)
// 3. 返回英文确认页(访客可见界面统一英文)
//
// 邮件客户端预取(fetch on open)可能触发 GET,但本接口写入幂等且
// Token 与邮箱一一对应,不会产生脏数据。

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { unsubscribers } from "@/lib/db/schema";
import { verifyUnsubscribeToken } from "@/lib/jwt";

// 简单邮箱格式校验,防止异常 payload 写入
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function renderConfirmationPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Unsubscribed - DolphinQuiz</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #f8fafc; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; max-width: 420px; text-align: center; }
    .icon { width: 56px; height: 56px; border-radius: 50%; background: #ecfdf5; color: #059669; font-size: 28px; line-height: 56px; margin: 0 auto 20px; }
    h1 { font-size: 20px; color: #0f172a; margin: 0 0 8px; }
    p { font-size: 14px; color: #64748b; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">&#10003;</div>
    <h1>You have been unsubscribed</h1>
    <p>You will no longer receive this type of email from DolphinQuiz.</p>
  </div>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  let email: string;
  try {
    email = await verifyUnsubscribeToken(token);
  } catch (error) {
    // Token 无效/过期:记录原因后返回通用提示(转换型异常,WARN 级别)
    console.warn(
      "unsubscribe token 校验失败:",
      error instanceof Error ? error.message : error
    );
    return new NextResponse("Invalid or expired link", { status: 400 });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return new NextResponse("Invalid or expired link", { status: 400 });
  }

  try {
    // source 记录邮件类型,token 留档用于审计
    const source = request.nextUrl.searchParams.get("source") ?? "newsletter";
    await db
      .insert(unsubscribers)
      .values({ email, source, token })
      .onConflictDoNothing();
  } catch (error) {
    console.error("unsubscribe 写入失败:", error);
    return new NextResponse("Internal error, please retry later", {
      status: 500,
    });
  }

  return new NextResponse(renderConfirmationPage(), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
