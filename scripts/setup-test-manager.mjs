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

// 模拟手动创建一个销售经理配置(临时测试用)
// 此脚本将在本地数据库创建一个测试经理用户,并把 quiz_edges 中 P3 选项的 result_manager_id 指向该用户
// 真实环境中,经理应在 Dashboard 中配置(Phase 3)

import postgres from "postgres";
import { randomUUID } from "crypto";

const LOCAL_DB_URL = "postgresql://postgres:111111@localhost:5432/sistine_starter";

async function main() {
  const sql = postgres(LOCAL_DB_URL, { prepare: false });

  try {
    console.log("=== 配置测试销售经理 ===");
    
    // 1. 检查是否已有测试经理
    const existingManager = await sql`SELECT id, email, name FROM "user" WHERE email = ${'sales_manager@test.com'}`;
    if (existingManager.length > 0) {
      console.log("测试经理已存在:", existingManager[0].email);
      console.log("经理 ID:", existingManager[0].id);
      console.log("(跳过创建)");
      return;
    }

    // 2. 创建测试经理用户
    // 注意: 这里我们不通过 Better Auth 创建完整用户(因为需要密码哈希)
    // 而是简单地插入一条记录,用于测试邮件发送逻辑
    const managerId = randomUUID();
    console.log("创建测试经理用户...");
    await sql`INSERT INTO "user" (id, email, name, email_verified, role, banned)
      VALUES (${managerId}, ${'sales_manager@test.com'}, ${'测试销售经理'}, true, ${'sales_manager'}, false)`;
    console.log("经理 ID:", managerId);
    
    // 3. 更新所有 P3 选项的 result_manager_id 指向该经理
    console.log("\n更新 P3 选项的 manager_id...");
    const updated = await sql`UPDATE quiz_edges SET result_manager_id = ${managerId} WHERE result_manager_id IS NULL AND option_label IS NOT NULL`;
    console.log(`更新了 ${updated.count} 条选项的 manager_id`);
    
    // 4. 验证
    console.log("\n=== 验证 ===");
    const p3Edges = await sql`SELECT count(*) FROM quiz_edges WHERE result_manager_id IS NOT NULL`;
    console.log(`已配置经理的选项数: ${p3Edges[0].count}`);
    
    console.log("\n✓ 销售经理配置完成!");
  } catch (error) {
    console.error("操作失败:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main().catch(console.error);
