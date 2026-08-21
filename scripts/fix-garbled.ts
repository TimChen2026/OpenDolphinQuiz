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


// 将乱码的 theme 字段更新为英文
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient);

const THEME_MAP: Record<string, string> = {
  "»æ»­": "Art",      // 绘画
  "ÊýÑ§": "Math",      // 数学
  "Ó¢Óï": "English",   // 英语
  "ÓïÎÄ": "Chinese",   // 语文
};

async function main() {
  console.log("更新 theme 乱码字段为英文...");
  for (const [garbled, english] of Object.entries(THEME_MAP)) {
    const result = await db.execute(
      `UPDATE projects SET theme = '${english}' WHERE theme = '${garbled}'`
    );
    console.log(`  ${JSON.stringify(garbled)} -> ${english}`);
  }

  // 验证更新结果
  const themes = await db.execute("SELECT DISTINCT theme FROM projects ORDER BY theme");
  console.log("\n更新后所有 theme 值:");
  for (const t of themes as any[]) {
    console.log("  ", JSON.stringify(t.theme));
  }

  // 统计数量
  const counts = await db.execute(
    "SELECT theme, COUNT(*) as cnt FROM projects GROUP BY theme ORDER BY theme"
  );
  console.log("\n各主题数量:");
  for (const c of counts as any[]) {
    console.log(`  ${c.theme}: ${c.cnt}`);
  }

  await queryClient.end();
}

main();