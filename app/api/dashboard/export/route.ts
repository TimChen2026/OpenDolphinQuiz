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

// Dashboard 数据库模块 - Excel 导出 API(Phase 4,AC-11)
//
// 功能:将当前租户的项目数据导出为 Excel 文件
// 访控:需登录 + Dashboard 权限
// 审计:操作成功后记录审计日志

import { NextRequest, NextResponse } from "next/server";
import { requireTeamAccess } from "@/lib/rbac";
import { getProjectsByTenant } from "@/lib/dashboard/project-status";
import { logAudit } from "@/lib/dashboard/audit-log";
import { AUDIT_ACTION_TYPES } from "@/lib/db/schema";
import ExcelJS from "exceljs";

export async function GET(request: NextRequest) {
  // 1. 校验登录 + 团队权限(项目数据按团队隔离)
  // 注:requireTeamAccess 在未登录时调用 redirect("/login") 抛出 NEXT_REDIRECT,
  //    因此必须放在 try-catch 外部,确保重定向正常生效
  const { user, teamId } = await requireTeamAccess();

  try {
    // 2. 获取项目数据
    const projects = await getProjectsByTenant(teamId);

    // 3. 创建 Excel 工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("项目数据");

    // 定义列
    worksheet.columns = [
      { header: "项目编号", key: "projectNumber", width: 30 },
      { header: "客户名", key: "customerName", width: 15 },
      { header: "主题", key: "theme", width: 15 },
      { header: "联系电话", key: "phone", width: 18 },
      { header: "邮箱", key: "email", width: 25 },
      { header: "询盘日期", key: "inquiryDate", width: 14 },
      { header: "询盘时间", key: "inquiryTime", width: 12 },
      { header: "项目状态", key: "projectStatus", width: 10 },
      { header: "项目金额", key: "projectAmount", width: 12 },
      { header: "持续时间(h)", key: "durationHours", width: 12 },
      { header: "间隔时间(h)", key: "intervalHours", width: 12 },
      { header: "是否超3天", key: "over3Days", width: 10 },
      { header: "回复日期", key: "replyDate", width: 14 },
      { header: "地区", key: "region", width: 12 },
      { header: "备注", key: "notes", width: 30 },
    ];

    // 添加数据行
    projects.forEach((project) => {
      worksheet.addRow({
        projectNumber: project.projectNumber,
        customerName: project.customerName,
        theme: project.theme,
        phone: project.phone,
        email: project.email,
        inquiryDate: project.inquiryDate,
        inquiryTime: project.inquiryTime,
        projectStatus: project.projectStatus,
        projectAmount: project.projectAmount,
        durationHours: project.durationHours,
        intervalHours: project.intervalHours,
        over3Days: project.over3Days ? "是" : "否",
        replyDate: project.replyDate,
        region: project.region,
        notes: project.notes,
      });
    });

    // 设置表头样式
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

    // 4. 生成 Excel 文件
    const buffer = await workbook.xlsx.writeBuffer();

    // 5. 记录审计日志
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? null;
    await logAudit({
      userId: user.id,
      actionType: "export",
      description: `导出项目数据(${projects.length}条记录)`,
      ipAddress: ip,
    });

    // 6. 返回文件
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="projects-${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("导出 Excel 失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "导出失败" },
      { status: 500 }
    );
  }
}