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
 * 从 HTM 文件解析并导入测试数据
 * HTM 是 Excel 保存的 Web 页面,数据在 sheet002.htm 中
 * 
 * 使用方法: pnpm tsx scripts/import-from-htm.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";
import { resolve } from "path";
import { pgTable, text, timestamp, boolean, date, time, numeric } from "drizzle-orm/pg-core";
import { readFileSync } from "fs";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

// ==================== 数据库表定义 ====================

const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  timezone: text("timezone"),
  plan: text("plan").default("free").notNull(),
});

const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  userId: text("user_id"),
  projectNumber: text("project_number").notNull(),
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
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

function generateId(): string {
  return crypto.randomUUID();
}

// ==================== HTM 解析器 ====================

/**
 * 读取文件并用 GB2312 解码
 */
function readGB2312(path: string): string {
  const buf = readFileSync(path);
  // 用 latin1 编码读取,保留原始字节不变
  // 后续通过比较原始字节的十六进制值来匹配中文字符
  return buf.toString("latin1");
}

/**
 * 解析 HTML 表格为二维数组
 */
function parseHtmlTable(html: string): string[][] {
  const rows: string[][] = [];
  
  // 匹配所有 <tr>...</tr>
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch;
  
  while ((trMatch = trRegex.exec(html)) !== null) {
    const trContent = trMatch[1];
    const cells: string[] = [];
    
    // 匹配 <td> 或 <th>
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;
    
    while ((cellMatch = cellRegex.exec(trContent)) !== null) {
      let cellContent = cellMatch[1];
      // 清理 HTML 标签和样式
      cellContent = cellContent
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/gi, "")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/\s+/g, " ")
        .trim();
      cells.push(cellContent);
    }
    
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  
  return rows;
}

// ==================== 数据解析函数 ====================

function parseDateStr(value: string): Date | null {
  if (!value) return null;
  // 格式: 2025/8/2 或 2025/08/02
  const m = value.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return null;
}

function parseTimeStr(value: string): string | null {
  if (!value) return null;
  const m = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const h = m[1].padStart(2, "0");
    const min = m[2].padStart(2, "0");
    const sec = m[3] ? m[3].padStart(2, "0") : "00";
    return `${h}:${min}:${sec}`;
  }
  return null;
}

function parseDatetimeStr(value: string): Date | null {
  if (!value) return null;
  // 2025/8/2 14:12
  const m = value.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0));
  }
  return null;
}

function parseStatus(value: string): string {
  // HTM 文件是 GB2312 编码,中文以 latin1 读取时是乱码
  // 用原始字节匹配: 跟进=b8fabdf8, 获单=bbf1b5a5, 失单=caa7b5a5
  const hex = Buffer.from(value, "latin1").toString("hex");
  if (hex === "bbf1b5a5") return "won";   // 获单
  if (hex === "caa7b5a5") return "lost";  // 失单
  if (hex === "b8fabdf8") return "follow_up"; // 跟进
  // 备用: 尝试明文匹配(如果已正确解码)
  if (value === "获单") return "won";
  if (value === "失单") return "lost";
  if (value === "跟进") return "follow_up";
  return "follow_up";
}

function parseYesNo(value: string): boolean | null {
  const v = value.toUpperCase();
  if (v === "Y" || v === "YES" || v === "是") return true;
  if (v === "N" || v === "NO" || v === "否") return false;
  return null;
}

function parseNumeric(value: string): string | null {
  if (!value) return null;
  // 处理 "7.00 " 格式
  const cleaned = value.replace(/[^\d.-]/g, "");
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return String(num);
}

// ==================== 主逻辑 ====================

async function main() {
  const adminEmail = "huiting.chen@outlook.com";
  const htmPath = resolve(process.cwd(), "项目需求文档", "附件2_Analysis_含图表.files", "sheet002.htm");

  if (!process.env.DATABASE_URL) {
    console.error("❌ 未找到 DATABASE_URL 环境变量");
    process.exit(1);
  }

  const queryClient = postgres(process.env.DATABASE_URL);
  const db = drizzle(queryClient);

  try {
    // ==================== Step 1: 获取管理员信息 ====================
    console.log("\n=== Step 1: 获取管理员信息 ===");
    const [adminUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, adminEmail))
      .limit(1);

    if (!adminUser) {
      console.error(`❌ 用户 ${adminEmail} 不存在`);
      process.exit(1);
    }
    console.log(`✓ 管理员: ${adminUser.name} (${adminUser.id})`);

    // ==================== Step 2: 获取经理映射 ====================
    console.log("\n=== Step 2: 获取销售经理映射 ===");
    const managerEmails = ["jack@test.com", "lucy@test.com", "lily@test.com", "tom@test.com"];
    const managerIdByName = new Map<string, string>();
    
    for (const email of managerEmails) {
      const [mgr] = await db.select().from(user).where(eq(user.email, email)).limit(1);
      if (mgr) {
        managerIdByName.set(mgr.name, mgr.id);
        console.log(`  ✓ ${mgr.name} -> ${mgr.id}`);
      }
    }

    // ==================== Step 3: 解析 HTM 文件 ====================
    console.log("\n=== Step 3: 解析 HTM 文件 ===");
    console.log(`📂 读取: ${htmPath}`);

    const html = readGB2312(htmPath);
    const tableRows = parseHtmlTable(html);
    console.log(`📊 共解析 ${tableRows.length} 行表格数据`);

    // 打印前3行用于调试
    for (let i = 0; i < Math.min(3, tableRows.length); i++) {
      const row = tableRows[i];
      console.log(`  行 ${i + 1}: [项目编号=${row[1] || ""}, 客户=${row[2] || ""}, 访问日期=${row[3] || ""}, 询盘日期=${row[6] || ""}, 负责人=${row[13] || ""}]`);
    }

    // 查找数据行的起始位置(跳过元数据行和标题行)
    // 数据行特征: 第2列(项目编号)以字母开头(如A1, A2等)
    let dataStart = -1;
    for (let i = 0; i < tableRows.length; i++) {
      const row = tableRows[i];
      const projectNo = (row[1] || "").trim();
      // 数据行的项目编号以字母开头(如A1, B1等),且不是标题文本
      if (/^[A-Za-z]\d/.test(projectNo)) {
        dataStart = i;
        break;
      }
    }
    // 备用:如果没找到字母开头的,跳过前3行(元数据+表头)
    if (dataStart === -1) {
      dataStart = 3;
      console.log("⚠️ 未找到字母开头的项目编号,使用默认跳过3行");
    }
    console.log(`数据从第 ${dataStart + 1} 行开始`);

    // ==================== Step 4: 清空旧数据并重新导入 ====================
    console.log("\n=== Step 4: 清空旧数据 ===");
    await db.delete(projects);
    console.log("✓ 已清空 projects 表");

    console.log("\n=== Step 5: 导入新数据 ===");
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // 列映射(从 0 开始):
    // 0=A(空), 1=B: 项目编号, 2=C: 客户名, 3=D: 访问日期, 4=E: 访问时间, 5=F: 访问日期+时间
    // 6=G: 询盘日期, 7=H: 询盘时间, 8=I: 询盘日期+时间
    // 9=J: 主题, 10=K: 联系电话, 11=L: 邮件, 12=M: 地区
    // 13=N: 负责人(经理名), 14=O: 回复日期, 15=P: 回复时间, 16=Q: 回复日期+时间
    // 17=R: 项目状态, 18=S: 项目金额, 19=T: 是否超过3天, 20=U: 持续时间
    // 21=V: 间隔时间, 22=W: 通知时间, 23=X: 备注

    for (let i = dataStart; i < tableRows.length; i++) {
      const row = tableRows[i];
      const customerName = (row[2] || "").trim();
      if (!customerName) {
        skipped++;
        continue;
      }

      // 调试:打印前5条数据的状态原始值
      if (i === dataStart) {
        console.log("\n前5条数据的状态值调试:");
      }
      if (i < dataStart + 5) {
        const statusRaw = (row[17] || "").trim();
        const hex = Buffer.from(statusRaw, "latin1").toString("hex");
        console.log(`  [${i}] 项目=${row[1]}, 状态原始=${statusRaw}, hex=${hex}, 解析结果=${parseStatus(statusRaw)}`);
      }

      const projectNumber = (row[1] || "").trim() || `${customerName}-${generateId().slice(0, 8)}`;
      
      // 解析日期
      const visitDate = parseDateStr(row[3] || "");
      const visitTime = parseTimeStr(row[4] || "");
      const visitDatetime = parseDatetimeStr(row[5] || "");
      const inquiryDate = parseDateStr(row[6] || "");
      const inquiryTime = parseTimeStr(row[7] || "");
      const inquiryDatetime = parseDatetimeStr(row[8] || "") || visitDatetime || new Date();
      
      const replyDate = parseDateStr(row[14] || "");
      const replyTime = parseTimeStr(row[15] || "");
      const replyDatetime = parseDatetimeStr(row[16] || "");

      const managerName = (row[13] || "").trim();
      const managerId = managerName ? (managerIdByName.get(managerName) ?? null) : null;

      const projectData = {
        id: generateId(),
        tenantId: adminUser.id,
        userId: adminUser.id,
        projectNumber,
        customerName,
        visitDate: visitDate?.toISOString().split("T")[0] ?? null,
        visitTime,
        visitDatetime,
        inquiryDate: inquiryDate?.toISOString().split("T")[0] ?? null,
        inquiryTime,
        inquiryDatetime,
        theme: (row[9] || "").trim() || null,
        phone: (row[10] || "").trim() || null,
        email: (row[11] || "").trim() || null,
        region: (row[12] || "").trim() || null,
        managerId,
        replyDate: replyDate?.toISOString().split("T")[0] ?? null,
        replyTime,
        replyDatetime,
        projectStatus: parseStatus(row[17] || ""),
        projectAmount: parseNumeric(row[18] || ""),
        over3Days: parseYesNo(row[19] || ""),
        durationHours: parseNumeric(row[20] || ""),
        intervalHours: parseNumeric(row[21] || ""),
        notificationTime: parseDatetimeStr(row[22] || ""),
        notes: (row[23] || "").trim() || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        await db.insert(projects).values(projectData);
        imported++;
      } catch (err: any) {
        errors.push(`行 ${i + 1} (${customerName}): ${err.message}`);
        skipped++;
      }
    }

    console.log(`\n=== 导入结果 ===`);
    console.log(`✅ 成功: ${imported} 条`);
    console.log(`⚠️  跳过: ${skipped} 条`);
    if (errors.length > 0) {
      console.log(`\n❌ 错误 (${errors.length} 个):`);
      errors.slice(0, 5).forEach(e => console.log(`  ${e}`));
      if (errors.length > 5) console.log(`  ... 还有 ${errors.length - 5} 个错误`);
    }

    // ==================== Step 6: 验证数据 ====================
    console.log("\n=== Step 6: 验证数据 ===");
    const allProjects = await db.select().from(projects);
    console.log(`数据库中共 ${allProjects.length} 条项目数据`);

    // 统计日期分布
    const dateCounts = new Map<string, number>();
    for (const p of allProjects) {
      if (p.inquiryDate) {
        dateCounts.set(p.inquiryDate, (dateCounts.get(p.inquiryDate) || 0) + 1);
      }
    }
    console.log("\n日期分布统计:");
    const sortedDates = [...dateCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    for (const [date, count] of sortedDates) {
      console.log(`  ${date}: ${count} 条`);
    }

    // 统计状态分布
    const statusCounts = new Map<string, number>();
    for (const p of allProjects) {
      statusCounts.set(p.projectStatus, (statusCounts.get(p.projectStatus) || 0) + 1);
    }
    console.log("\n状态分布:");
    for (const [status, count] of statusCounts) {
      console.log(`  ${status}: ${count} 条`);
    }

    // 统计经理分布
    const managerNameById = new Map<string, string>();
    for (const [name, id] of managerIdByName) {
      managerNameById.set(id, name);
    }
    const managerCounts = new Map<string, number>();
    for (const p of allProjects) {
      const name = p.managerId ? (managerNameById.get(p.managerId) || "未知") : "未分配";
      managerCounts.set(name, (managerCounts.get(name) || 0) + 1);
    }
    console.log("\n经理分布:");
    for (const [name, count] of managerCounts) {
      console.log(`  ${name}: ${count} 条`);
    }

    console.log("\n✅ 全部完成!");
  } catch (error) {
    console.error("❌ 执行失败:", error);
  } finally {
    await queryClient.end();
  }
}

main();