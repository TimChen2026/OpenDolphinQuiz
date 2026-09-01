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

// Dashboard 控制台共享类型(Phase 3)
//
// 对应 API 响应结构,供各 Tab 视图组件使用

// ==================== 项目 ====================

export type DashboardProject = {
  id: string;
  projectNumber: string;
  customerName: string;
  theme: string | null;
  phone: string | null;
  email: string | null;
  inquiryDatetime: string | null;
  replyDatetime: string | null;
  projectStatus: string;
  durationHours: string | null;
  over3Days: boolean | null;
  warningYellowAt: string | null;
  warningRedAt: string | null;
  notificationTime: string | null;
  notes: string | null;
  /** 负责人(销售经理 ID) */
  managerId: string | null;
  /** 间隔时间(小时,= 回复时间 - 询盘时间) */
  intervalHours: string | null;
  /** 项目金额 */
  projectAmount: string | null;
};

// ==================== 模板编辑 ====================

export type EditableOptionData = {
  id: string;
  optionLabel: string;
  optionText: string;
  targetNodeId: string | null;
  resultTheme: string | null;
  resultManagerId: string | null;
  // 是否启用(C/D 可关闭):关闭后不参与问卷/节点图/链接生成
  isEnabled: boolean;
};

export type EditableNodeData = {
  id: string;
  level: string;
  question: string;
  parentId: string | null;
  options: EditableOptionData[];
};

export type DashboardTemplate = {
  id: string;
  name: string;
  description: string | null;
  nodes: EditableNodeData[] | null;
};

// ==================== 邮件模板 ====================

export type EmailTemplateData = {
  templateType: string;
  name: string;
  subject: string;
  body: string;
};

// ==================== 团队 ====================

export type SalesManager = {
  id: string;
  name: string;
  email: string;
  /** 电话(解密后,可能为空) */
  phone?: string | null;
};

export type ThemeAssignment = {
  theme: string;
  managerId: string | null;
  managerName: string | null;
  edgeCount: number;
};

// ==================== 预警设置 ====================

export type WarningSettings = {
  yellowHours: number;
  redHours: number;
};

// ==================== 询盘限制 ====================

export type InquiryLimitStatus = {
  count: number;
  /** 每日询盘上限(null = 套餐无硬上限,Pro/Max 不受限,前端不展示统计) */
  limit: number | null;
  nearLimit: number;
  isLimited: boolean;
  isNearLimit: boolean;
};
