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
 * 检查 HTM 文件中 inquiry_date 列的日期分布
 * 查看 Oct 9-30, Nov 9-29, Dec 9-30 是否为空
 */
import { readFileSync } from "fs";
import { resolve } from "path";

const htmPath = resolve(process.cwd(), "项目需求文档", "附件2_Analysis_含图表.files", "sheet002.htm");
const buf = readFileSync(htmPath);
const html = buf.toString("latin1");

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

const tableRows = parseHtmlTable(html);

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

// 检查 inquiry_date (column 6, 0-indexed) 的分布
const inquiryDates = new Map<string, number>();
for (let i = dataStart; i < tableRows.length; i++) {
  const row = tableRows[i];
  const customerName = (row[2] || "").trim();
  if (!customerName) continue;
  const inquiryDate = (row[6] || "").trim();
  if (inquiryDate) {
    inquiryDates.set(inquiryDate, (inquiryDates.get(inquiryDate) || 0) + 1);
  } else {
    inquiryDates.set("(empty)", (inquiryDates.get("(empty)") || 0) + 1);
  }
}

// 检查 visit_date (column 3, 0-indexed) 的分布
const visitDates = new Map<string, number>();
for (let i = dataStart; i < tableRows.length; i++) {
  const row = tableRows[i];
  const customerName = (row[2] || "").trim();
  if (!customerName) continue;
  const visitDate = (row[3] || "").trim();
  if (visitDate) {
    visitDates.set(visitDate, (visitDates.get(visitDate) || 0) + 1);
  }
}

// 找到 Oct 9-30, Nov 9-29, Dec 9-30 的 inquiry_date
console.log("=== 检查 Inquiry Date 在间隔期间的分布 ===");
const sortedInquiry = [...inquiryDates.entries()].sort((a, b) => a[0].localeCompare(b[0]));

// 过滤出 2025/10/9 - 2025/10/30 的 inquiry_date
const octRange = sortedInquiry.filter(([d]) => d.startsWith("2025/10/") && !d.startsWith("(empty)"));
const oct9To30 = octRange.filter(([d]) => {
  const day = parseInt(d.split("/")[2]);
  return day >= 9 && day <= 30;
});
console.log(`\n2025/10/9 - 2025/10/30 inquiry_date 条目: ${oct9To30.length}`);
oct9To30.slice(0, 5).forEach(([d, c]) => console.log(`  ${d}: ${c}`));

// 过滤出 2025/11/9 - 2025/11/29 的 inquiry_date
const novRange = sortedInquiry.filter(([d]) => d.startsWith("2025/11/") && !d.startsWith("(empty)"));
const nov9To29 = novRange.filter(([d]) => {
  const day = parseInt(d.split("/")[2]);
  return day >= 9 && day <= 29;
});
console.log(`\n2025/11/9 - 2025/11/29 inquiry_date 条目: ${nov9To29.length}`);
nov9To29.slice(0, 5).forEach(([d, c]) => console.log(`  ${d}: ${c}`));

// 过滤出 2025/12/9 - 2025/12/30 的 inquiry_date
const decRange = sortedInquiry.filter(([d]) => d.startsWith("2025/12/") && !d.startsWith("(empty)"));
const dec9To30 = decRange.filter(([d]) => {
  const day = parseInt(d.split("/")[2]);
  return day >= 9 && day <= 30;
});
console.log(`\n2025/12/9 - 2025/12/30 inquiry_date 条目: ${dec9To30.length}`);
dec9To30.slice(0, 5).forEach(([d, c]) => console.log(`  ${d}: ${c}`));

// 检查 visit_date 是否能覆盖这些空隙
console.log("\n=== 检查 Visit Date 在间隔期间的分布 ===");
const sortedVisit = [...visitDates.entries()].sort((a, b) => a[0].localeCompare(b[0]));

const octVisit = sortedVisit.filter(([d]) => d.startsWith("2025/10/"));
const oct9To30Visit = octVisit.filter(([d]) => {
  const day = parseInt(d.split("/")[2]);
  return day >= 9 && day <= 30;
});
console.log(`\n2025/10/9 - 2025/10/30 visit_date 条目: ${oct9To30Visit.length}`);
oct9To30Visit.slice(0, 5).forEach(([d, c]) => console.log(`  ${d}: ${c}`));

// 统计空 inquiry_date 的行查看其 visit_date
console.log("\n=== 空 inquiry_date 的数据行 (前10条) ===");
let emptyCount = 0;
for (let i = dataStart; i < tableRows.length && emptyCount < 10; i++) {
  const row = tableRows[i];
  const customerName = (row[2] || "").trim();
  if (!customerName) continue;
  const inquiryDate = (row[6] || "").trim();
  if (!inquiryDate) {
    console.log(`  行 ${i+1}: project=${row[1]}, customer=${row[2]}, visit_date=${row[3]}, inquiry_date=${row[6] || "(空)"}`);
    emptyCount++;
  }
}

console.log("\n✅ 检查完成");