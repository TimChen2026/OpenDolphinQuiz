#!/usr/bin/env tsx

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


/**
 * 测试数据导入与账号设置脚本
 * 
 * 功能:
 * 1. 为 huiting.chen@outlook.com 设置管理员角色 + 旗舰版(max)套餐
 * 2. 创建测试销售经理账号(Jack/Lucy/Lily/Tom)
 * 3. 从附件2 Excel 导入 600+ 条项目测试数据
 * 
 * 使用方法: pnpm tsx scripts/setup-test-data.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, inArray } from "drizzle-orm";
import dotenv from "dotenv";
import { resolve } from "path";
import { pgTable, text, timestamp, boolean, date, time, numeric } from "drizzle-orm/pg-core";
import ExcelJS from "exceljs";

// 加载环境变量
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

// ==================== 数据库表定义 ====================

const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role").default("user").notNull(),
  isDirector: boolean("is_director").default(false).notNull(),
  phone: text("phone"),
  passportStatus: text("passport_status").default("unverified").notNull(),
  passportVerifiedAt: timestamp("passport_verified_at"),
  passportExpiresAt: timestamp("passport_expires_at"),
  timezone: text("timezone"),
  plan: text("plan").default("free").notNull(),
  banned: boolean("banned").default(false).notNull(),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  userId: text("user_id"),
  projectNumber: text("project_number").notNull().unique(),
  customerName: text("customer_name").notNull(),
  visitDate: date("visit_date"),
  visitTime: time("visit_time"),
  visitDatetime: timestamp("visit_datetime"),
  inquiryDate: date("inquiry_date"),
  inquiryTime: time("inquiry_time"),
  inquiryDatetime: timestamp("inquiry_datetime").notNull(),
  theme: text("theme"),
  phone: text("phone"),
  email: text("email"),
  region: text("region"),
  managerId: text("manager_id"),
  replyDate: date("reply_date"),
  replyTime: time("reply_time"),
  replyDatetime: timestamp("reply_datetime"),
  projectStatus: text("project_status").default("follow_up").notNull(),
  projectAmount: numeric("project_amount"),
  over3Days: boolean("over_3_days"),
  durationHours: numeric("duration_hours"),
  intervalHours: numeric("interval_hours"),
  notificationTime: timestamp("notification_time"),
  warningYellowAt: timestamp("warning_yellow_at"),
  warningRedAt: timestamp("warning_red_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==================== 辅助函数 ====================

function generateId(): string {
  return crypto.randomUUID();
}

/** 解析 Excel 日期串为 Date */
function parseExcelDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const str = String(value).trim();
  if (!str) return null;
  // 尝试多种格式
  const formats = [
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})/,       // 2025/8/2
    /^(\d{4})-(\d{1,2})-(\d{1,2})/,           // 2025-08-02
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})/,         // 8/2/2025
    /^(\d{4})\.(\d{1,2})\.(\d{1,2})/,         // 2025.8.2
  ];
  for (const fmt of formats) {
    const m = str.match(fmt);
    if (m) {
      const [_, y, mo, d] = m;
      return new Date(Number(y), Number(mo) - 1, Number(d));
    }
  }
  return null;
}

/** 解析时间字符串 "18:53" 或 "3:08" */
function parseTime(value: unknown): string | null {
  if (!value) return null;
  const str = String(value).trim();
  if (!str) return null;
  const m = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const h = m[1].padStart(2, "0");
    const min = m[2].padStart(2, "0");
    const sec = m[3] ? m[3].padStart(2, "0") : "00";
    return `${h}:${min}:${sec}`;
  }
  return null;
}

/** 解析日期时间字符串 "2025/8/2 18:53" 或 "2025-08-03T20:08:00" */
function parseDatetime(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const str = String(value).trim();
  if (!str) return null;
  // 尝试带时间的格式
  const m = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0));
  }
  // ISO 格式
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  return null;
}

/** 解析状态映射 */
function parseStatus(value: unknown): string {
  if (!value) return "follow_up";
  const str = String(value).trim();
  if (str === "获单") return "won";
  if (str === "失单") return "lost";
  if (str === "跟进") return "follow_up";
  return "follow_up";
}

/** 解析布尔值 Y/N */
function parseYesNo(value: unknown): boolean | null {
  if (!value) return null;
  const str = String(value).trim().toUpperCase();
  if (str === "Y" || str === "YES" || str === "是") return true;
  if (str === "N" || str === "NO" || str === "否") return false;
  return null;
}

/** 解析数值 */
function parseNumeric(value: unknown): string | null {
  if (!value) return null;
  const str = String(value).trim();
  if (!str || str === "NA") return null;
  const num = parseFloat(str);
  if (isNaN(num)) return null;
  return String(num);
}

// ==================== 主逻辑 ====================

async function main() {
  const adminEmail = "huiting.chen@outlook.com";
  const excelPath = resolve(process.cwd(), "项目需求文档", "附件2_Analysis_含图表.xlsx");

  if (!process.env.DATABASE_URL) {
    console.error("❌ 未找到 DATABASE_URL 环境变量");
    console.log("请确保 .env.local 文件中设置了 DATABASE_URL");
    process.exit(1);
  }

  const queryClient = postgres(process.env.DATABASE_URL);
  const db = drizzle(queryClient);

  try {
    // ==================== Step 1: 设置管理员+旗舰版套餐 ====================
    console.log("\n=== Step 1: 设置管理员账号 + 旗舰版套餐 ===");
    console.log(`🔍 查找用户: ${adminEmail}`);

    const [adminUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, adminEmail))
      .limit(1);

    if (!adminUser) {
      console.error(`❌ 用户 ${adminEmail} 不存在，请先注册`);
      await queryClient.end();
      process.exit(1);
    }

    console.log(`✓ 找到用户: ${adminUser.name} (当前角色: ${adminUser.role}, 套餐: ${adminUser.plan ?? "free"})`);

    await db
      .update(user)
      .set({
        role: "admin",
        plan: "max",
        isDirector: true,
        updatedAt: new Date(),
      })
      .where(eq(user.email, adminEmail));

    console.log(`✅ 已设置 ${adminEmail} 为管理员 + 旗舰版(max)套餐`);

    // ==================== Step 2: 创建销售经理测试账号 ====================
    console.log("\n=== Step 2: 创建测试销售经理账号 ===");
    const managerAccounts = [
      { name: "Jack", email: "jack@test.com" },
      { name: "Lucy", email: "lucy@test.com" },
      { name: "Lily", email: "lily@test.com" },
      { name: "Tom", email: "tom@test.com" },
    ];

    const managerIdByName = new Map<string, string>();

    for (const mgr of managerAccounts) {
      const [existing] = await db
        .select()
        .from(user)
        .where(eq(user.email, mgr.email))
        .limit(1);

      if (existing) {
        console.log(`  ✓ ${mgr.name}(${mgr.email}) 已存在, ID: ${existing.id}`);
        if (existing.role !== "sales_manager") {
          await db.update(user).set({ role: "sales_manager", updatedAt: new Date() }).where(eq(user.email, mgr.email));
          console.log(`  → 已更新角色为 sales_manager`);
        }
        managerIdByName.set(mgr.name, existing.id);
      } else {
        const id = generateId();
        await db.insert(user).values({
          id,
          name: mgr.name,
          email: mgr.email,
          emailVerified: true,
          role: "sales_manager",
          plan: "free",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`  ✅ 已创建: ${mgr.name}(${mgr.email}), ID: ${id}`);
        managerIdByName.set(mgr.name, id);
      }
    }

    // ==================== Step 3: 从 Excel 导入项目数据 ====================
    console.log("\n=== Step 3: 导入项目测试数据 ===");
    console.log(`📂 读取 Excel: ${excelPath}`);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelPath);
    const sheet = workbook.getWorksheet("数据");

    if (!sheet) {
      console.error("❌ 找不到 '数据' sheet");
      await queryClient.end();
      process.exit(1);
    }

    // 读取所有行(从第4行开始,前3行为标题)
    const rows: Record<string, unknown>[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber >= 4) {
        const values: Record<string, unknown> = {};
        row.eachCell((cell, colNumber) => {
          // Excel 列 B=1, C=2, ... 对应我们的数组索引
          values[colNumber] = cell.value;
        });
        rows.push(values);
      }
    });

    console.log(`📊 共读取 ${rows.length} 行数据`);

    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      // 列映射(从1开始):
      // 1=B: 项目编号, 2=C: 客户名, 3=D: 访问日期, 4=E: 访问时间, 5=F: 访问日期+时间
      // 6=G: 询盘日期, 7=H: 询盘时间, 8=I: 询盘日期+时间
      // 9=J: 主题, 10=K: 联系电话, 11=L: 邮件, 12=M: 地区
      // 13=N: 负责人(经理名), 14=O: 回复日期, 15=P: 回复时间, 16=Q: 回复日期+时间
      // 17=R: 项目状态, 18=S: 项目金额, 19=T: 是否超过3天, 20=U: 持续时间
      // 21=V: 间隔时间, 22=W: 通知时间, 23=X: 备注

      const customerName = String(row[2] ?? "").trim();
      if (!customerName) {
        skipped++;
        continue;
      }

      const projectNumber = String(row[1] ?? "").trim() || `${customerName}-${generateId().slice(0, 8)}`;
      const inquiryDatetime = parseDatetime(row[8]) ?? parseDatetime(row[5]) ?? new Date();

      // 负责人名 -> managerId
      const managerName = String(row[13] ?? "").trim();
      const managerId = managerName ? (managerIdByName.get(managerName) ?? null) : null;

      // 构建项目数据
      const projectData = {
        id: generateId(),
        tenantId: adminUser.id, // 租户=管理员
        userId: adminUser.id,
        projectNumber,
        customerName,
        visitDate: parseExcelDate(row[3])?.toISOString().split("T")[0] ?? null,
        visitTime: parseTime(row[4]),
        visitDatetime: parseDatetime(row[5]),
        inquiryDate: parseExcelDate(row[6])?.toISOString().split("T")[0] ?? null,
        inquiryTime: parseTime(row[7]),
        inquiryDatetime,
        theme: String(row[9] ?? "").trim() || null,
        phone: String(row[10] ?? "").trim() || null,
        email: String(row[11] ?? "").trim() || null,
        region: String(row[12] ?? "").trim() || null,
        managerId,
        replyDate: parseExcelDate(row[14])?.toISOString().split("T")[0] ?? null,
        replyTime: parseTime(row[15]),
        replyDatetime: parseDatetime(row[16]),
        projectStatus: parseStatus(row[17]),
        projectAmount: parseNumeric(row[18]),
        over3Days: parseYesNo(row[19]),
        durationHours: parseNumeric(row[20]),
        intervalHours: parseNumeric(row[21]),
        notificationTime: parseDatetime(row[22]),
        notes: String(row[23] ?? "").trim() || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        await db.insert(projects).values(projectData);
        imported++;
      } catch (err) {
        // 唯一冲突跳过
        skipped++;
      }
    }

    console.log(`✅ 导入完成: 成功 ${imported} 条, 跳过 ${skipped} 条`);

    // ==================== 汇总 ====================
    console.log("\n=== 汇总 ===");
    console.log(`✅ 管理员: ${adminEmail} (角色: admin, 套餐: max)`);
    console.log(`✅ 销售经理: ${managerAccounts.map((m) => m.name).join(", ")}`);
    console.log(`✅ 导入项目数据: ${imported} 条`);
    console.log("\n🚀 现在可以访问:");
    console.log("   - http://localhost:3000/zh/admin/internal (内部管理页)");
    console.log("   - http://localhost:3000/zh/dashboard (控制台, 查看数据库和数据分析全部功能)");
  } catch (error) {
    console.error("❌ 执行失败:", error);
    await queryClient.end();
    process.exit(1);
  }

  await queryClient.end();
  process.exit(0);
}

main();