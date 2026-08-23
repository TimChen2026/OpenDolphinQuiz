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

// Dashboard 交互界面数据 API(Phase 3 Task 3.1/3.3)
//
// GET: 获取当前租户激活 Quiz 模板的完整可编辑数据(节点+选项)
// 无激活模板时自动创建默认模板(含免费客户首次进入)
// 权限:管理员/销售总监/销售经理/普通注册用户均可访问 Dashboard

import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/rbac";
import { getActiveClientTemplate } from "@/lib/quiz/queries";
import { createDefaultQuizTemplate } from "@/lib/quiz/template-init";
import { getEditableTemplate } from "@/lib/dashboard/quiz-editor";
import { getProjectsByTenant } from "@/lib/dashboard/project-status";
import { getInquiryLimitStatusForTenant } from "@/lib/dashboard/inquiry-limit";
import { getQuizLimitStatusForTenant } from "@/lib/plan-limits";

export async function GET() {
  try {
    const user = await requireDashboardAccess();

    // 获取租户激活模板
    let clientTemplate = await getActiveClientTemplate(user.id);
    if (!clientTemplate) {
      // 新注册用户(含免费客户)首次进入仪表盘时没有模板:
      // 自动创建默认模板并直接置为激活,保证三个视图(项目看板/交互界面/逻辑界面)可正常加载
      // 创建前校验套餐 Quiz 数量配额(Free 1 / Pro 6 / Max 12)
      const quizLimit = await getQuizLimitStatusForTenant(
        user.id,
        user.plan
      );
      if (quizLimit.isLimited) {
        return NextResponse.json(
          {
            error: `当前套餐最多创建 ${quizLimit.limit} 个 Quiz 问卷,已达上限,请升级套餐`,
          },
          { status: 403 }
        );
      }
      await createDefaultQuizTemplate(user.id, { status: "active" });
      clientTemplate = await getActiveClientTemplate(user.id);
    }
    if (!clientTemplate) {
      return NextResponse.json(
        { error: "当前没有激活的 Quiz 模板" },
        { status: 404 }
      );
    }

    // 获取可编辑模板数据(节点+选项)
    const editableTemplate = await getEditableTemplate(clientTemplate.id);

    // 获取项目列表(交互界面)
    const projects = await getProjectsByTenant(user.id);

    // 获取询盘限制状态(升级提示横幅)
    const limitStatus = await getInquiryLimitStatusForTenant(user.id);

    return NextResponse.json({
      template: {
        id: clientTemplate.id,
        name: clientTemplate.name,
        description: clientTemplate.description,
        nodes: editableTemplate,
      },
      projects,
      limitStatus,
    });
  } catch (error) {
    console.error("dashboard template 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取 Dashboard 数据失败" },
      { status: 500 }
    );
  }
}
