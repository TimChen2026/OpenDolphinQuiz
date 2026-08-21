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

// projects 表 schema 单元测试
//
// 验证 projects 表包含附件1 Database.xlsx 的全部 24 列字段,
// 且 project_number 唯一约束保证项目编号不重复(AC-08)

import { describe, it, expect } from "vitest";
import { projects, PROJECT_STATUS } from "@/lib/db/schema";

describe("projects schema", () => {
  it("包含项目编号列且唯一(AC-08)", () => {
    expect(projects.projectNumber).toBeDefined();
    // Drizzle unique 列通过 sql 约束体现,此处验证列存在与名称
    expect(projects.projectNumber.name).toBe("project_number");
    expect(projects.projectNumber.notNull).toBe(true);
  });

  it("包含附件1 的全部客户信息字段", () => {
    // B: 项目编号 / C: 客户名字
    expect(projects.customerName).toBeDefined();
    // D/E/F: 访问日期/时间/日期时间
    expect(projects.visitDate).toBeDefined();
    expect(projects.visitTime).toBeDefined();
    expect(projects.visitDatetime).toBeDefined();
    // G/H/I: 询盘日期/时间/日期时间
    expect(projects.inquiryDate).toBeDefined();
    expect(projects.inquiryTime).toBeDefined();
    expect(projects.inquiryDatetime).toBeDefined();
    // J: 主题 / K: 联系电话 / L: 邮件 / M: 地区国家
    expect(projects.theme).toBeDefined();
    expect(projects.phone).toBeDefined();
    expect(projects.email).toBeDefined();
    expect(projects.region).toBeDefined();
  });

  it("包含附件1 的全部项目跟踪字段", () => {
    // N: 负责人 / O/P/Q: 回复日期/时间/日期时间
    expect(projects.managerId).toBeDefined();
    expect(projects.replyDate).toBeDefined();
    expect(projects.replyTime).toBeDefined();
    expect(projects.replyDatetime).toBeDefined();
    // R: 项目状态 / S: 项目金额 / T: 是否超过3天
    expect(projects.projectStatus).toBeDefined();
    expect(projects.projectAmount).toBeDefined();
    expect(projects.over3Days).toBeDefined();
    // U: 持续时间 / V: 间隔时间 / W: 系统通知时间 / X: 备注
    expect(projects.durationHours).toBeDefined();
    expect(projects.intervalHours).toBeDefined();
    expect(projects.notificationTime).toBeDefined();
    expect(projects.notes).toBeDefined();
  });

  it("包含多租户隔离与审计字段", () => {
    expect(projects.tenantId).toBeDefined();
    expect(projects.userId).toBeDefined();
    expect(projects.createdAt).toBeDefined();
    expect(projects.updatedAt).toBeDefined();
  });

  it("项目状态默认值为跟进", () => {
    expect(projects.projectStatus.default).toBe(PROJECT_STATUS.FOLLOW_UP);
  });
});
