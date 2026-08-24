/*
 * Copyright (C) 2026 DolphinQuiz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// 参考模板应用逻辑
//
// - applyReferenceTemplate:将共享参考模板(如教育培训)完整写入当前模板,
//   重建全部节点与选项(重新生成 ID,清空销售经理关联,避免跨团队引用)
// - clearTemplateContent: 清空当前模板的节点问题与选项文本,等待用户重新输入

import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { quizNodes, quizEdges } from "@/lib/db/schema";
import type { ReferenceTemplate } from "@/lib/reference-templates";

/**
 * 应用参考模板到指定 Quiz 模板
 *
 * 步骤:
 * 1. 删除模板现有全部节点(选项随外键级联删除)
 * 2. 为参考节点生成新 ID,维护 oldId → newId 映射
 * 3. 按 P1→P2→P3→P4 层级依次插入节点
 * 4. 插入选项(跳转目标映射为新 ID)
 *
 * 主键约束:
 * - result_manager_id 清空:参考模板中的销售经理属于原团队,跨团队不可引用
 * - 主题词 result_theme 保留(行业主题词与团队无关)
 *
 * @param templateId 目标 Quiz 模板 ID
 * @param ref 参考模板数据
 */
export async function applyReferenceTemplate(
  templateId: string,
  ref: ReferenceTemplate
): Promise<void> {
  await db.transaction(async (tx) => {
    // 1. 删除模板现有全部节点(选项通过外键级联删除)
    await tx
      .delete(quizNodes)
      .where(eq(quizNodes.templateId, templateId));

    // 2. 建立引用节点 ID 映射(参考模板节点 → 新随机 ID)
    const idMap = new Map<string, string>();
    for (const node of ref.nodes) {
      idMap.set(node.id, crypto.randomUUID());
    }

    // 3. 按 P1→P2→P3→P4 层级顺序插入节点
    const levelOrder = ["P1", "P2", "P3", "P4"];
    const nodesByLevel = new Map<string, ReferenceTemplate["nodes"]>();
    for (const node of ref.nodes) {
      const list = nodesByLevel.get(node.level) ?? [];
      list.push(node);
      nodesByLevel.set(node.level, list);
    }

    const nodeRows: (typeof quizNodes.$inferInsert)[] = [];
    let sortOrder = 0;
    for (const level of levelOrder) {
      for (const node of nodesByLevel.get(level) ?? []) {
        nodeRows.push({
          id: idMap.get(node.id)!,
          templateId,
          parentId: node.parentId ? idMap.get(node.parentId) ?? null : null,
          level: node.level,
          question: node.question,
          sortOrder: sortOrder++,
          resultTheme: null,
          resultManagerId: null,
        });
      }
    }
    await tx.insert(quizNodes).values(nodeRows);

    // 4. 插入全部选项(跳转目标映射为新 ID;销售经理清空)
    const edgeRows: (typeof quizEdges.$inferInsert)[] = [];
    for (const node of ref.nodes) {
      const newNodeId = idMap.get(node.id)!;
      node.options.forEach((option, index) => {
        edgeRows.push({
          id: crypto.randomUUID(),
          nodeId: newNodeId,
          optionLabel: option.optionLabel,
          optionText: option.optionText,
          targetNodeId: option.targetNodeId
            ? idMap.get(option.targetNodeId) ?? null
            : null,
          sortOrder: index,
          resultTheme: option.resultTheme,
          resultManagerId: null,
        });
      });
    }
    await tx.insert(quizEdges).values(edgeRows);
  });
}

/**
 * 清空 Quiz 模板的问卷内容
 *
 * 将模板全部节点的问题、选项的文本与结果关联清空,
 * 保留决策树结构(跳转关系),等待用户重新输入。
 *
 * @param templateId 目标 Quiz 模板 ID
 */
export async function clearTemplateContent(templateId: string): Promise<void> {
  await db.transaction(async (tx) => {
    const nodes = await tx
      .select({ id: quizNodes.id })
      .from(quizNodes)
      .where(eq(quizNodes.templateId, templateId));
    const nodeIds = nodes.map((n) => n.id);
    if (nodeIds.length === 0) {
      return;
    }

    // 清空节点问题与节点级关联
    await tx
      .update(quizNodes)
      .set({ question: "", resultTheme: null, resultManagerId: null })
      .where(inArray(quizNodes.id, nodeIds));
    // 清空选项文案与选项级关联
    await tx
      .update(quizEdges)
      .set({ optionText: "", resultTheme: null, resultManagerId: null })
      .where(inArray(quizEdges.nodeId, nodeIds));
  });
}