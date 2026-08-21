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


import { readFileSync } from "fs";
import { resolve } from "path";

const path = resolve(process.cwd(), "项目需求文档", "附件2_Analysis_含图表.files", "sheet002.htm");
const buf = readFileSync(path);

// 尝试用 iconv-lite 解码 GB2312
try {
  const iconv = require("iconv-lite");
  const text = iconv.decode(buf, "gbk");
  // 查找状态列
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  let count = 0;
  while ((match = trRegex.exec(text)) !== null && count < 5) {
    const cells = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cm;
    while ((cm = cellRegex.exec(match[1])) !== null) {
      cells.push(cm[1].replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, "").trim());
    }
    if (cells.length > 17 && cells[1] && /^[A-Z]/.test(cells[1])) {
      console.log(`项目: ${cells[1]}, 客户: ${cells[2]}, 状态: ${cells[17]}`);
      count++;
    }
  }
} catch (e: any) {
  console.log("iconv-lite 不可用:", e.message);
  console.log("尝试其他方法...");
  
  // 直接查看原始字节
  const text = buf.toString("latin1");
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  let count = 0;
  while ((match = trRegex.exec(text)) !== null && count < 5) {
    const cells = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cm;
    while ((cm = cellRegex.exec(match[1])) !== null) {
      cells.push(cm[1].replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, "").trim());
    }
    if (cells.length > 17 && cells[1] && /^[A-Z]/.test(cells[1])) {
      // 显示状态列的原始字节
      const statusRaw = cells[17];
      const hex = Buffer.from(statusRaw, "latin1").toString("hex");
      console.log(`项目: ${cells[1]}, 状态原始: [${statusRaw}] hex: ${hex}`);
      count++;
    }
  }
}