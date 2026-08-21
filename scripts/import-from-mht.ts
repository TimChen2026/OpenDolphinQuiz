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
 * 从 MHT 文件解析并导入测试数据
 * MHT 是 Excel 的 Web 存档格式,包含 HTML 表格
 * 
 * 使用方法: pnpm tsx scripts/import-from-mht.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";
import { resolve } from "path";
import { pgTable, text, timestamp, boolean, date, time, numeric } from "drizzle-orm/pg-core";
import { readFileSync, writeFileSync } from "fs";

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

function generateId(): string {
  return crypto.randomUUID();
}

// ==================== MHT 解析器 ====================

/**
 * 从 MHT 文件中提取指定 Content-Location 的 HTML 内容
 */
function extractPart(mhtPath: string, contentLocation: string): string {
  const buf = readFileSync(mhtPath);
  // 用 latin1 编码读取,避免 GB2312 解码问题
  const content = buf.toString("latin1");
  
  // 查找 boundary
  const boundaryMatch = content.match(/boundary="(.*?)"/);
  if (!boundaryMatch) throw new Error("找不到 MHT boundary");
  const boundary = boundaryMatch[1];
  
  // 分割 parts
  const parts = content.split(boundary);
  
  for (const part of parts) {
    if (part.includes(contentLocation)) {
      // 找到 headers 和 body 的分隔
      const bodyStart = part.indexOf("\r\n\r\n");
      if (bodyStart === -1) continue;
      return part.substring(bodyStart + 4);
    }
  }
  throw new Error(`找不到 Content-Location: ${contentLocation}`);
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
      // 解码 quoted-printable 编码
      cellContent = decodeQuotedPrintable(cellContent);
      // 清理 HTML 标签
      cellContent = cellContent
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/gi, "")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .trim();
      cells.push(cellContent);
    }
    
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  
  return rows;
}

/**
 * 解码 quoted-printable 编码
 */
function decodeQuotedPrintable(text: string): string {
  // MHT 使用 quoted-printable 编码,=XX 表示十六进制字节
  // 但我们是 latin1 读取的,所以需要处理 =XX 序列
  return text.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => {
    const code = parseInt(hex, 16);
    // GB2312 中文字符是多字节的,需要特殊处理
    // 这里简单处理:返回 latin1 字符
    return String.fromCharCode(code);
  });
}

/**
 * 将 GB2312 编码的 latin1 字符串转换为 UTF-8 字符串
 */
function gb2312ToUtf8(latin1Str: string): string {
  try {
    // 创建一个 Buffer 来重新编码
    const buf = Buffer.alloc(latin1Str.length);
    for (let i = 0; i < latin1Str.length; i++) {
      buf[i] = latin1Str.charCodeAt(i);
    }
    // 尝试用 iconv-lite 或直接使用 TextDecoder
    // 但这里我们用最简单的方式:直接返回 latin1 字符串
    // 因为 Excel 中数字和日期是 ASCII 的
    return latin1Str;
  } catch {
    return latin1Str;
  }
}

// ==================== 数据解析函数 ====================

function parseDateStr(value: string): Date | null {
  if (!value) return null;
  // Excel 导出的日期格式: 2025/8/2 或 2025-08-02
  const m = value.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const m2 = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m2) {
    return new Date(Number(m2[1]), Number(m2[2]) - 1, Number(m2[3]));
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
  // 2025/8/2 18:53
  const m = value.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] ?? 0));
  }
  const d = new Date(value);
  if (!isNaN(d.getTime())) return d;
  return null;
}

function parseStatus(value: string): string {
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
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  return String(num);
}

// ==================== 主逻辑 ====================

async function main() {
  const adminEmail = "huiting.chen@outlook.com";
  const mhtPath = resolve(process.cwd(), "项目需求文档", "附件2_Analysis_含图表.mht");

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

    // ==================== Step 3: 解析 MHT 文件 ====================
    console.log("\n=== Step 3: 解析 MHT 文件 ===");
    console.log(`📂 读取: ${mhtPath}`);

    // 提取 sheet002.htm (数据 sheet)
    const sheetHtml = extractPart(mhtPath, "sheet002.htm");
    // 保存到临时文件用于调试
    writeFileSync(resolve(process.cwd(), "temp_sheet002.html"), sheetHtml, "latin1");
    console.log(`✓ 已提取 sheet002.htm (${sheetHtml.length} 字节)`);
    
    // 解析 HTML 表格
    const tableRows = parseHtmlTable(sheetHtml);
    console.log(`📊 共解析 ${tableRows.length} 行表格数据`);

    // 打印前5行用于调试
    for (let i = 0; i < Math.min(5, tableRows.length); i++) {
      console.log(`  行 ${i}: [${tableRows[i].slice(0, 10).join(" | ")}]`);
    }

    // 查找数据行的起始位置(跳过标题行)
    let dataStart = 0;
    for (let i = 0; i < tableRows.length; i++) {
      const row = tableRows[i];
      // 数据行通常以项目编号或客户名开始
      if (row[1] && /^[A-Z]{2}\d{4}/.test(row[1])) {
        dataStart = i;
        break;
      }
    }
    console.log(`数据从第 ${dataStart + 1} 行开始`);

    // ==================== Step 4: 清空旧数据并重新导入 ====================
    console.log("\n=== Step 4: 清空旧数据 ===");
    const deleteResult = await db.delete(projects);
    console.log(`✓ 已清空 projects 表`);

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

      const projectNumber = (row[1] || "").trim() || `${customerName}-${generateId().slice(0, 8)}`;
      
      // 解析日期 - 关键修复点
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
      errors.slice(0, 10).forEach(e => console.log(`  ${e}`));
      if (errors.length > 10) console.log(`  ... 还有 ${errors.length - 10} 个错误`);
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
    const managerCounts = new Map<string, number>();
    for (const p of allProjects) {
      const name = p.managerId ? [...managerIdByName.entries()].find(([_, id]) => id === p.managerId)?.[0] || "未知" : "未分配";
      managerCounts.set(name, (managerCounts.get(name) || 0) + 1);
    }
    console.log("\n经理分布:");
    for (const [name, count] of managerCounts) {
      console.log(`  ${name}: ${count} 条`);
    }

    // ==================== 清理临时文件 ====================
    try {
      const { unlinkSync } = await import("fs");
      unlinkSync(resolve(process.cwd(), "temp_sheet002.html"));
    } catch {}

    console.log("\n✅ 全部完成!");
  } catch (error) {
    console.error("❌ 执行失败:", error);
  } finally {
    await queryClient.end();
  }
}

main();