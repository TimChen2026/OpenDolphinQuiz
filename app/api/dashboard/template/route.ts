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
import { requireTeamAccess } from "@/lib/rbac";
import { getActiveClientTemplate } from "@/lib/quiz/queries";
import { createDefaultQuizTemplate } from "@/lib/quiz/template-init";
import { getEditableTemplate } from "@/lib/dashboard/quiz-editor";
import { getThemeAssignments } from "@/lib/dashboard/team";
import {
  getVisibleProjectsByTenant,
  listTeamProjectPermissions,
  isTeamAdminViewer,
} from "@/lib/dashboard/project-permissions";
import { getInquiryLimitStatusForTenant } from "@/lib/dashboard/inquiry-limit";
import { getQuizLimitStatusForTenant, getPlanLimits } from "@/lib/plan-limits";

export async function GET() {
  try {
    // 团队隔离:租户数据按团队(teamId)而非个人 userId 查询
    const { teamId, teamPlan, user } = await requireTeamAccess();

    // 获取租户激活模板
    let clientTemplate = await getActiveClientTemplate(teamId);
    if (!clientTemplate) {
      // 新注册用户(含免费客户)首次进入仪表盘时没有模板:
      // 自动创建默认模板并直接置为激活,保证三个视图(项目看板/交互界面/逻辑界面)可正常加载
      // 创建前校验团队套餐 Quiz 数量配额(Free 1 / Pro 6 / Max 12)
      const quizLimit = await getQuizLimitStatusForTenant(
        teamId,
        teamPlan
      );
      if (quizLimit.isLimited) {
        return NextResponse.json(
          {
            error: `Your plan allows up to ${quizLimit.limit} quizzes, limit reached, please upgrade`,
          },
          { status: 403 }
        );
      }
      await createDefaultQuizTemplate(teamId, { status: "active" });
      clientTemplate = await getActiveClientTemplate(teamId);
    }
    if (!clientTemplate) {
      return NextResponse.json(
        { error: "No active Quiz template" },
        { status: 404 }
      );
    }

    // 获取可编辑模板数据(节点+选项)
    const editableTemplate = await getEditableTemplate(clientTemplate.id);

    // 获取项目列表(项目看板,按查看者角色过滤)
    const viewer = {
      id: user.id,
      role: user.role,
      isDirector: user.isDirector,
      email: user.email,
    };
    const projects = await getVisibleProjectsByTenant(teamId, viewer);

    // 获取询盘限制状态(升级提示横幅;仅 Free 有每日询盘上限,Pro/Max 不限制)
    const limitStatus = await getInquiryLimitStatusForTenant(
      teamId,
      getPlanLimits(teamPlan).dailyInquiryLimit
    );

    // 项目查看授权信息(管理员可授权销售经理查看非自己跟踪的项目)
    const permissionsMap = await listTeamProjectPermissions(teamId);
    const projectPermissions = Object.fromEntries(permissionsMap);
    const canGrantAccess = isTeamAdminViewer(teamId, viewer);

    // 主题 → 跟踪项目经理映射(团队界面配置的主题-经理关联,用于项目表格显示经理名)
    const themeAssignments = await getThemeAssignments(clientTemplate.id);
    const themeManagers: Record<string, string> = {};
    for (const assignment of themeAssignments) {
      if (assignment.managerName) {
        themeManagers[assignment.theme] = assignment.managerName;
      }
    }

    return NextResponse.json({
      template: {
        id: clientTemplate.id,
        name: clientTemplate.name,
        description: clientTemplate.description,
        nodes: editableTemplate,
      },
      projects,
      limitStatus,
      projectPermissions,
      canGrantAccess,
      themeManagers,
    });
  } catch (error) {
    console.error("dashboard template 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
