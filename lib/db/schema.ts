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

import { pgTable, text, timestamp, boolean, varchar, integer, date, time, numeric, unique } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  // 用户角色:admin | sales_director | sales_manager | user
  role: text("role").default("user").notNull(),
  // 是否兼任销售总监(可与销售经理角色并存,验收修订 2.1.7.5)
  isDirector: boolean("is_director").default(false).notNull(),
  // 手机号(加密存储,MVP阶段仅格式校验)
  phone: text("phone"),
  // 通行证状态:unverified | verified | expired
  passportStatus: text("passport_status").default("unverified").notNull(),
  // 通行证验证时间
  passportVerifiedAt: timestamp("passport_verified_at"),
  // 通行证过期时间
  passportExpiresAt: timestamp("passport_expires_at"),
  // 用户时区(如 Asia/Shanghai)
  timezone: text("timezone"),
  // 套餐计划:free | pro | max(Phase 6 支付接入后使用)
  plan: text("plan").default("free").notNull(),
  // 账号类型:member(团队成员,属于一个团队) | customer(客户,可属于多个团队)
  accountType: text("account_type").default("member").notNull(),
  // 封禁状态
  banned: boolean("banned").default(false).notNull(),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// 用户角色常量
export const USER_ROLES = {
  ADMIN: "admin",
  SALES_DIRECTOR: "sales_director",
  SALES_MANAGER: "sales_manager",
  USER: "user",
} as const;

// 用户套餐常量(定价方案:free/pro/max)
export const USER_PLANS = {
  FREE: "free",
  PRO: "pro",
  MAX: "max",
} as const;

// 账号类型常量:团队成员(单团队) / 客户(可多团队,仅访问问卷)
export const ACCOUNT_TYPES = {
  MEMBER: "member",
  CUSTOMER: "customer",
} as const;

// 团队成员角色常量:admin(团队管理员,第一个加入者) / member(普通成员) / customer(客户)
export const TEAM_MEMBER_ROLES = {
  ADMIN: "admin",
  MEMBER: "member",
  CUSTOMER: "customer",
} as const;

// 通行证状态常量
export const PASSPORT_STATUS = {
  UNVERIFIED: "unverified",
  VERIFIED: "verified",
  EXPIRED: "expired",
} as const;

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Password reset tokens
export const passwordResetToken = pgTable("password_reset_token", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Newsletter subscriptions
export const newsletterSubscription = pgTable("newsletter_subscription", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  status: varchar("status", { length: 16 }).notNull().default("active"), // active, unsubscribed
  unsubscribeToken: text("unsubscribe_token").notNull().unique(),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  unsubscribedAt: timestamp("unsubscribed_at"),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
});

// ==================== 团队(Team)管理 ====================

// 团队表:id 复用创建者(团队管理员)的 userId,
// 使既有 tenant_id 数据(模板/项目/邮件模板/预警设置)无需迁移即归属团队
export const team = pgTable("team", {
  id: text("id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  // 团队/公司名称(注册时输入,重名时加入已有团队)
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 团队成员表:用户与团队的多对多关联
// 团队成员(member)仅属于一个团队;客户(customer)可属于多个团队
export const teamMember = pgTable(
  "team_member",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // 团队内角色:admin(管理员) | member(普通成员) | customer(客户)
    role: text("role").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    // 同一用户在同一团队仅一条记录(客户跨团队时各团队一条)
    unique("team_member_team_user_unique").on(table.teamId, table.userId),
  ]
);

// ==================== Quiz 决策树模块 ====================

// Quiz 模板状态常量
export const QUIZ_TEMPLATE_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  ARCHIVED: "archived",
} as const;

// Quiz 节点层级常量
export const QUIZ_NODE_LEVELS = {
  P1: "P1", // 根节点
  P2: "P2", // 中间层
  P3: "P3", // 选择层
  P4: "P4", // 结果层(Summary 摘要展示,附件3 新增)
} as const;

// Quiz 选项标签常量
export const QUIZ_OPTION_LABELS = {
  A: "A",
  B: "B",
  C: "C",
  D: "D",
} as const;

// Quiz 模板表(每个租户可有多个模板,MVP 阶段仅一套)
export const quizTemplates = pgTable("quiz_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  // 多租户隔离:tenant_id = user.id
  tenantId: text("tenant_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // 模板状态:draft(草稿)/active(启用)/archived(归档)
  status: text("status").default(QUIZ_TEMPLATE_STATUS.DRAFT).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Quiz 节点表(邻接表模型,parent_id 自引用实现树形结构)
export const quizNodes = pgTable("quiz_nodes", {
  id: text("id").primaryKey(),
  templateId: text("template_id")
    .notNull()
    .references(() => quizTemplates.id, { onDelete: "cascade" }),
  // 父节点 ID,根节点(P1)为 null
  parentId: text("parent_id"),
  level: text("level").notNull(), // P1/P2/P3
  question: text("question").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  // P3 节点默认关联的主题(可被选项级 result_theme 覆盖)
  resultTheme: text("result_theme"),
  // P3 节点默认关联的销售经理(可被选项级 result_manager_id 覆盖)
  resultManagerId: text("result_manager_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Quiz 选项表(边/跳转关系)
export const quizEdges = pgTable("quiz_edges", {
  id: text("id").primaryKey(),
  nodeId: text("node_id")
    .notNull()
    .references(() => quizNodes.id, { onDelete: "cascade" }),
  optionLabel: text("option_label").notNull(), // A/B/C/D
  optionText: text("option_text").notNull(),
  // P1/P2 选项指向下一节点;P3 选项为终点时为 null
  targetNodeId: text("target_node_id"),
  sortOrder: integer("sort_order").notNull().default(0),
  // 选项级主题(优先级高于节点级 result_theme)
  resultTheme: text("result_theme"),
  // 选项级销售经理(优先级高于节点级 result_manager_id)
  resultManagerId: text("result_manager_id"),
  // 选项是否启用:关闭(C/D)后不参与问卷、节点图与链接生成
  isEnabled: boolean("is_enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ==================== 项目跟踪信息表(基于附件1 Database.xlsx 24 列) ====================

// 项目状态常量(英文存储,与系统默认英文语言一致)
export const PROJECT_STATUS = {
  FOLLOW_UP: "follow_up",
  WON: "won",
  LOST: "lost",
} as const;

// 项目业务数据表:单表存储客户信息 + 项目跟踪信息
// 字段映射自附件1 Database.xlsx 的 B-X 列,允许扩展但不得删减
export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  // 多租户隔离:tenant_id = 销售方用户 id
  tenantId: text("tenant_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // 提交询盘的客户用户 id(注册后关联 Quiz 结果)
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  // B: 项目编号(客户名-询盘日期-询盘时间),唯一约束保证不重复
  projectNumber: text("project_number").notNull().unique(),
  // C: 客户名字
  customerName: text("customer_name").notNull(),
  // D: 访问日期
  visitDate: date("visit_date"),
  // E: 访问时间
  visitTime: time("visit_time"),
  // F: 访问日期+时间
  visitDatetime: timestamp("visit_datetime"),
  // G: 发起询盘日期
  inquiryDate: date("inquiry_date"),
  // H: 询盘时间
  inquiryTime: time("inquiry_time"),
  // I: 询盘日期+时间(记录询盘时刻,Phase 2 仅必填此项)
  inquiryDatetime: timestamp("inquiry_datetime").notNull(),
  // J: 主题(P3 选项关联的主题)
  theme: text("theme"),
  // K: 联系电话(应用层 AES-256-GCM 加密存储)
  phone: text("phone"),
  // L: 邮件
  email: text("email"),
  // M: 地区/国家(基于浏览器时区自动判断,参考性)
  region: text("region"),
  // N: 负责人(销售经理 user.id)
  managerId: text("manager_id"),
  // O: 回复日期
  replyDate: date("reply_date"),
  // P: 回复时间
  replyTime: time("reply_time"),
  // Q: 回复日期+时间
  replyDatetime: timestamp("reply_datetime"),
  // R: 项目状态(follow_up/won/lost)
  projectStatus: text("project_status").default(PROJECT_STATUS.FOLLOW_UP).notNull(),
  // S: 项目金额
  projectAmount: numeric("project_amount"),
  // T: 是否超过 3 天
  over3Days: boolean("over_3_days"),
  // U: 持续时间(小时)
  durationHours: numeric("duration_hours"),
  // V: 间隔时间(小时,= 回复时间 - 询盘时间)
  intervalHours: numeric("interval_hours"),
  // W: 系统通知时间
  notificationTime: timestamp("notification_time"),
  // 黄色预警发送时间(Phase 3,>=24h 触发时记录)
  warningYellowAt: timestamp("warning_yellow_at"),
  // 红色预警发送时间(Phase 3,>=48h 触发时记录)
  warningRedAt: timestamp("warning_red_at"),
  // X: 备注
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ==================== 项目查看授权(管理员授权销售经理查看特定项目) ====================

// 项目查看授权表:管理员可授权销售经理查看非自己跟踪的项目
// 默认:管理员/销售总监可看全部项目,销售经理仅看自己跟踪的项目(manager_id)
export const projectPermissions = pgTable(
  "project_permissions",
  {
    id: text("id").primaryKey(),
    // 被授权查看的项目
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    // 被授权的销售经理用户 id
    managerId: text("manager_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // 多租户隔离:项目所属团队(便于按团队清理/查询)
    tenantId: text("tenant_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    // 授权人(团队管理员用户 id)
    grantedBy: text("granted_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // 同一项目对同一经理仅一条授权
    unique("project_permissions_project_manager_unique").on(
      table.projectId,
      table.managerId
    ),
  ]
);

// ==================== Phase 3: Dashboard 控制台模块 ====================

// 邮件模板类型常量
export const EMAIL_TEMPLATE_TYPES = {
  // 注:项目报告邮件(report)已于 Phase 3 验收修订中删除,与内部告知邮件重复,
  // 询盘通知统一使用 internal 模板
  // Summary 摘要模板(展示给客户)
  SUMMARY: "summary",
  // 内部告知邮件(Internal Email)
  INTERNAL: "internal",
  // 黄色预警邮件(≥24h)
  WARNING_YELLOW: "warning_yellow",
  // 红色预警邮件(≥48h)
  WARNING_RED: "warning_red",
  // 询盘次数接近上限提示邮件(≥3次)
  INQUIRY_NEAR_LIMIT: "inquiry_near_limit",
  // 询盘次数达到上限提示邮件(≥5次)
  INQUIRY_REACH_LIMIT: "inquiry_reach_limit",
} as const;

// 邮件模板表(Dashboard 报告模板编辑保存,Phase 3)
export const emailTemplates = pgTable("email_templates", {
  id: text("id").primaryKey(),
  // 多租户隔离:tenant_id = user.id
  tenantId: text("tenant_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // 模板类型:report/summary/internal/warning_yellow/warning_red 等
  templateType: text("template_type").notNull(),
  // 模板名称(中文,便于界面识别)
  name: text("name").notNull(),
  // 邮件主题(支持 @变量 占位符)
  subject: text("subject").notNull(),
  // 邮件正文(支持 @变量 占位符)
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// 预警设置表(每租户一条,Phase 3)
export const warningSettings = pgTable("warning_settings", {
  id: text("id").primaryKey(),
  // 多租户隔离:tenant_id = user.id,唯一约束保证每租户一条
  tenantId: text("tenant_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  // 黄色预警触发小时数(默认 24)
  yellowHours: integer("yellow_hours").default(24).notNull(),
  // 红色预警触发小时数(默认 48)
  redHours: integer("red_hours").default(48).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ==================== Phase 4: 审计日志 ====================

// 审计日志操作类型常量
export const AUDIT_ACTION_TYPES = {
  LOGIN: "login",
  LOGOUT: "logout",
  EXPORT: "export",
  DELETE: "delete",
  UPDATE: "update",
  CREATE: "create",
} as const;

// 审计日志表
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  // 操作者用户 ID
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // 操作类型: login/logout/export/delete/update/create
  actionType: text("action_type").notNull(),
  // 操作描述(如"Export project data (N records)")
  description: text("description").notNull(),
  // 操作详情(JSON,可选,存储额外的上下文信息)
  details: text("details"),
  // 操作者 IP 地址
  ipAddress: text("ip_address"),
  // 操作时间
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
