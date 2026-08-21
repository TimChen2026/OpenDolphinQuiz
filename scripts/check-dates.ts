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

async function main() {
  const queryClient = postgres(process.env.DATABASE_URL!);
  const db = drizzle(queryClient);
  const rows = await db.execute("SELECT inquiry_date, COUNT(*)::int as cnt FROM projects GROUP BY inquiry_date ORDER BY inquiry_date");
  console.log("当前日期分布:");
  for (const r of rows) console.log(`  ${r.inquiry_date}: ${r.cnt} 条`);
  const total = await db.execute("SELECT COUNT(*)::int as cnt FROM projects");
  console.log(`\n总数: ${total[0].cnt} 条`);
  await queryClient.end();
}
main();