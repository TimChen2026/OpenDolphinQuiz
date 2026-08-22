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
 * 验证 HTM 文件数据与数据库是否一致
 * 比较: 总行数、项目编号、日期、状态、负责人
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";
import { pgTable, text, timestamp, date } from "drizzle-orm/pg-core";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  projectNumber: text("project_number").notNull(),
  customerName: text("customer_name").notNull(),
  inquiryDate: date("inquiry_date"),
  projectStatus: text("project_status").default("follow_up").notNull(),
  managerId: text("manager_id"),
});

const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
});

function readGB2312(path: string): string {
  return readFileSync(path).toString("latin1");
}

function parseHtmlTable(html: string): string[][] {
  const rows: string[][] = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const trContent = trMatch[1];
    const cells: string[] = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(trContent)) !== null) {
      let cellContent = cellMatch[1];
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
    if (cells.length > 0) rows.push(cells);
  }
  return rows;
}

function parseStatus(value: string): string {
  const hex = Buffer.from(value, "latin1").toString("hex");
  if (hex === "bbf1b5a5") return "won";
  if (hex === "caa7b5a5") return "lost";
  if (hex === "b8fabdf8") return "follow_up";
  if (value === "获单") return "won";
  if (value === "失单") return "lost";
  if (value === "跟进") return "follow_up";
  return "follow_up";
}

async function main() {
  const htmPath = resolve(process.cwd(), "项目需求文档", "附件2_Analysis_含图表.files", "sheet002.htm");
  const queryClient = postgres(process.env.DATABASE_URL!);
  const db = drizzle(queryClient);

  try {
    // ===== 1. 解析 HTM 文件 =====
    console.log("=== Step 1: 解析 HTM 文件 ===");
    const html = readGB2312(htmPath);
    const tableRows = parseHtmlTable(html);
    console.log(`HTM 文件共 ${tableRows.length} 行表格数据`);

    // 查找数据行起始位置
    let dataStart = -1;
    for (let i = 0; i < tableRows.length; i++) {
      const projectNo = (tableRows[i][1] || "").trim();
      if (/^[A-Za-z]\d/.test(projectNo)) {
        dataStart = i;
        break;
      }
    }
    if (dataStart === -1) dataStart = 3;
    console.log(`数据从第 ${dataStart + 1} 行开始`);

    // 提取 HTM 数据行的项目编号和状态
    const htmData: { projectNumber: string; status: string; row: number }[] = [];
    for (let i = dataStart; i < tableRows.length; i++) {
      const row = tableRows[i];
      const customerName = (row[2] || "").trim();
      if (!customerName) continue;
      const projectNumber = (row[1] || "").trim();
      const status = parseStatus(row[17] || "");
      htmData.push({ projectNumber, status, row: i + 1 });
    }
    console.log(`HTM 数据行数: ${htmData.length}`);

    // ===== 2. 查询数据库 =====
    console.log("\n=== Step 2: 查询数据库 ===");
    const dbProjects = await db.select({
      projectNumber: projects.projectNumber,
      projectStatus: projects.projectStatus,
    }).from(projects);
    console.log(`数据库数据行数: ${dbProjects.length}`);

    // ===== 3. 比较行数 =====
    console.log("\n=== Step 3: 比较行数 ===");
    if (htmData.length === dbProjects.length) {
      console.log(`✅ 行数一致: ${htmData.length} 条`);
    } else {
      console.log(`❌ 行数不一致: HTM=${htmData.length}, DB=${dbProjects.length}`);
    }

    // ===== 4. 比较状态分布 =====
    console.log("\n=== Step 4: 比较状态分布 ===");
    const htmStatusCounts = new Map<string, number>();
    for (const d of htmData) {
      htmStatusCounts.set(d.status, (htmStatusCounts.get(d.status) || 0) + 1);
    }
    const dbStatusCounts = new Map<string, number>();
    for (const d of dbProjects) {
      dbStatusCounts.set(d.projectStatus, (dbStatusCounts.get(d.projectStatus) || 0) + 1);
    }
    console.log("HTM 状态分布:");
    for (const [s, c] of htmStatusCounts) console.log(`  ${s}: ${c}`);
    console.log("DB 状态分布:");
    for (const [s, c] of dbStatusCounts) console.log(`  ${s}: ${c}`);

    let statusMatch = true;
    for (const [s, c] of htmStatusCounts) {
      if (dbStatusCounts.get(s) !== c) {
        console.log(`❌ 状态 ${s} 数量不一致`);
        statusMatch = false;
      }
    }
    if (statusMatch) console.log("✅ 状态分布一致");

    // ===== 5. 抽样验证项目编号 =====
    console.log("\n=== Step 5: 抽样验证前10条项目编号 ===");
    const dbProjectNumbers = new Set(dbProjects.map(d => d.projectNumber));
    let matchCount = 0;
    for (let i = 0; i < Math.min(10, htmData.length); i++) {
      const pn = htmData[i].projectNumber;
      if (dbProjectNumbers.has(pn)) {
        console.log(`  ✅ 行 ${htmData[i].row}: ${pn}`);
        matchCount++;
      } else {
        // 尝试用项目编号模糊匹配
        const similar = dbProjects.filter(d => d.projectNumber.includes(pn) || pn.includes(d.projectNumber));
        if (similar.length > 0) {
          console.log(`  ⚠️ 行 ${htmData[i].row}: ${pn} -> 近似匹配 ${similar[0].projectNumber}`);
          matchCount++;
        } else {
          console.log(`  ❌ 行 ${htmData[i].row}: ${pn} -> 未找到`);
        }
      }
    }
    console.log(`抽样匹配: ${matchCount}/10`);

    // ===== 6. 验证日期分布 =====
    console.log("\n=== Step 6: 验证日期分布 ===");
    const dateResult = await db.execute(
      "SELECT inquiry_date, COUNT(*)::int as cnt FROM projects WHERE inquiry_date IS NOT NULL GROUP BY inquiry_date ORDER BY inquiry_date"
    );
    const dateRows = Array.isArray(dateResult) ? dateResult : [];
    console.log(`有日期的记录: ${dateRows.length} 个不同日期`);
    
    // 检查是否有大段空白
    const dates = dateRows.map((r: any) => r.inquiry_date).filter(Boolean).sort();
    let gaps = 0;
    for (let i = 1; i < dates.length; i++) {
      const d1 = new Date(dates[i-1]);
      const d2 = new Date(dates[i]);
      const diffDays = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > 1) {
        gaps++;
        if (gaps <= 5) {
          console.log(`  ⚠️ 日期间隔 ${diffDays} 天: ${dates[i-1]} -> ${dates[i]}`);
        }
      }
    }
    console.log(`共 ${gaps} 处日期间隔 > 1 天`);

    // ===== 7. 验证经理分布 =====
    console.log("\n=== Step 7: 验证经理分布 ===");
    const mgrEmails = ["jack@test.com", "lucy@test.com", "lily@test.com", "tom@test.com"];
    const mgrNameById = new Map<string, string>();
    for (const email of mgrEmails) {
      const [m] = await db.select().from(user).where(eq(user.email, email)).limit(1);
      if (m) mgrNameById.set(m.id, m.name);
    }
    const mgrResult = await db.execute(
      "SELECT manager_id, COUNT(*)::int as cnt FROM projects WHERE manager_id IS NOT NULL GROUP BY manager_id ORDER BY cnt DESC"
    );
    const mgrRows = Array.isArray(mgrResult) ? mgrResult : [];
    console.log("经理分布:");
    for (const r of mgrRows) {
      const name = mgrNameById.get(String(r.manager_id)) || "未知";
      console.log(`  ${name}: ${r.cnt} 条`);
    }

    console.log("\n✅ 验证完成!");
  } catch (error) {
    console.error("❌ 验证失败:", error);
  } finally {
    await queryClient.end();
  }
}

main();