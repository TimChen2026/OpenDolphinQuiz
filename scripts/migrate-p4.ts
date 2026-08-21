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
 * 存量 Quiz 模板 P4 节点迁移脚本(Phase 3 验收修订)
 *
 * 背景:附件3 Quiz问答逻辑表 V2.0.xlsx 新增了 P4 结果节点(64 个),
 * 本脚本为已有模板补齐 P4 节点,并将 P3 选项的 target_node_id 指向对应 P4。
 *
 * 逻辑(幂等,可重复执行):
 * 1. 遍历所有模板的 P3 节点
 * 2. 查找 target_node_id 为 null 的 P3 选项(旧结构终点)
 * 3. 为该选项创建 P4 结果节点(继承选项的主题与经理),并更新选项跳转
 *
 * 使用方法: pnpm exec tsx scripts/migrate-p4.ts
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, inArray, isNull } from "drizzle-orm";
import dotenv from "dotenv";
import { resolve } from "path";
import {
  quizTemplates,
  quizNodes,
  quizEdges,
} from "../lib/db/schema";

// 加载环境变量
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function migrateP4() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ 未找到 DATABASE_URL 环境变量(.env.local)");
    process.exit(1);
  }

  const queryClient = postgres(process.env.DATABASE_URL);
  const db = drizzle(queryClient);

  try {
    const templates = await db.select().from(quizTemplates);
    console.log(`🔍 找到 ${templates.length} 个 Quiz 模板`);

    let totalCreated = 0;

    for (const tpl of templates) {
      const p3Nodes = await db
        .select()
        .from(quizNodes)
        .where(
          and(eq(quizNodes.templateId, tpl.id), eq(quizNodes.level, "P3"))
        );
      const p3Ids = p3Nodes.map((n) => n.id);
      if (p3Ids.length === 0) {
        continue;
      }

      // 查找旧结构终点选项(target_node_id 为 null 的 P3 选项)
      const terminalEdges = await db
        .select()
        .from(quizEdges)
        .where(and(inArray(quizEdges.nodeId, p3Ids), isNull(quizEdges.targetNodeId)));

      let created = 0;
      for (const edge of terminalEdges) {
        const p3 = p3Nodes.find((n) => n.id === edge.nodeId);
        // 从 P3 节点 id 提取路径后缀(如 {templateId}-p3-ab → ab)
        const suffix = p3
          ? p3.id.includes("-p3-")
            ? p3.id.split("-p3-")[1]
            : p3.id.slice(-2)
          : "xx";
        const p4Id = `${tpl.id}-p4-${suffix}-${edge.optionLabel.toLowerCase()}`;

        // 幂等:已存在则跳过
        const existing = await db
          .select({ id: quizNodes.id })
          .from(quizNodes)
          .where(eq(quizNodes.id, p4Id))
          .limit(1);
        if (existing.length > 0) {
          continue;
        }

        await db.insert(quizNodes).values({
          id: p4Id,
          templateId: tpl.id,
          parentId: edge.nodeId,
          level: "P4",
          question: `P4 结果节点(${edge.resultTheme ?? "Summary"})`,
          sortOrder: edge.sortOrder,
          resultTheme: edge.resultTheme,
          resultManagerId: edge.resultManagerId,
        });

        await db
          .update(quizEdges)
          .set({ targetNodeId: p4Id })
          .where(eq(quizEdges.id, edge.id));

        created++;
        totalCreated++;
      }

      if (created > 0) {
        console.log(`✓ 模板 ${tpl.id.slice(-8)}: 新增 ${created} 个 P4 节点`);
      } else {
        console.log(`- 模板 ${tpl.id.slice(-8)}: 已是最新结构,无需迁移`);
      }
    }

    console.log(`✅ 迁移完成,共新增 ${totalCreated} 个 P4 节点`);
  } catch (error) {
    console.error("❌ 迁移失败:", error);
    await queryClient.end();
    process.exit(1);
  }

  await queryClient.end();
  process.exit(0);
}

migrateP4();
