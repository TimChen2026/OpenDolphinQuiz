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


import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient);

async function main() {
  // 查找所有 customerName 和 theme 的乱码
  const rows = await db.execute(
    "SELECT id, project_number, customer_name, theme FROM projects ORDER BY project_number"
  );

  // 找出包含乱码的字段
  const garbled: { project_number: string; issues: string }[] = [];
  for (const r of rows as any[]) {
    const issues: string[] = [];
    const cn = r.customer_name;
    const th = r.theme;
    if (cn && /[\x80-\xFF]/.test(Buffer.from(cn, "utf-8").toString("binary"))) {
      issues.push("customer_name=" + JSON.stringify(cn) + " hex=" + Buffer.from(cn, "utf-8").toString("hex"));
    }
    if (th && /[\x80-\xFF]/.test(Buffer.from(th, "utf-8").toString("binary"))) {
      issues.push("theme=" + JSON.stringify(th) + " hex=" + Buffer.from(th, "utf-8").toString("hex"));
    }
    if (issues.length > 0) {
      garbled.push({ project_number: r.project_number, issues: issues.join(", ") });
    }
  }

  console.log("含乱码的记录数:", garbled.length);
  for (const g of garbled) {
    console.log("  ", g.project_number, "->", g.issues);
  }

  // 统计所有主题和客户名的唯一值
  const themes = await db.execute("SELECT DISTINCT theme FROM projects ORDER BY theme");
  console.log("\n所有主题值:");
  for (const t of themes as any[]) {
    const hex = Buffer.from(t.theme, "utf-8").toString("hex");
    const hasGarbled = /[\x80-\xFF]/.test(Buffer.from(t.theme, "utf-8").toString("binary"));
    console.log("  ", JSON.stringify(t.theme), "hex=" + hex, hasGarbled ? "⚠️ 乱码" : "✓");
  }

  const names = await db.execute("SELECT DISTINCT customer_name FROM projects ORDER BY customer_name");
  console.log("\n所有客户名:");
  for (const n of names as any[]) {
    const hex = Buffer.from(n.customer_name, "utf-8").toString("hex");
    const hasGarbled = /[\x80-\xFF]/.test(Buffer.from(n.customer_name, "utf-8").toString("binary"));
    console.log("  ", JSON.stringify(n.customer_name), "hex=" + hex, hasGarbled ? "⚠️ 乱码" : "✓");
  }

  await queryClient.end();
}

main();