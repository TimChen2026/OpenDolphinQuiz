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

// Quiz 问卷链接生成前检查 API(Phase 3 验收修订 2.1.8)
//
// GET: 检查当前租户激活模板的信息齐备性
// 权限:管理员/销售总监/销售经理可访问 Dashboard

import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/rbac";
import { getActiveClientTemplate } from "@/lib/quiz/queries";
import { checkTemplateReadiness } from "@/lib/dashboard/link-check";

export async function GET() {
  try {
    const user = await requireDashboardAccess();

    const clientTemplate = await getActiveClientTemplate(user.id);
    if (!clientTemplate) {
      return NextResponse.json(
        { ok: false, issues: [{ nodeId: "", level: "-", message: "当前没有激活的 Quiz 模板" }] },
        { status: 200 }
      );
    }

    const result = await checkTemplateReadiness(clientTemplate.id);
    // 返回模板 ID,供"链接生成"拼装指向当前租户模板的问卷链接(验收修订 2.1.8-b)
    return NextResponse.json({ ...result, templateId: clientTemplate.id });
  } catch (error) {
    console.error("link-check 错误:", error);
    return NextResponse.json(
      { ok: false, issues: [{ nodeId: "", level: "-", message: "检查失败,请稍后重试" }] },
      { status: 500 }
    );
  }
}
