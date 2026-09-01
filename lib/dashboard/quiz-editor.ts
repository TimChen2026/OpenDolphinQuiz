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

// Quiz 模板编辑逻辑(Phase 3 Task 3.3)
//
// 功能:
// - 获取模板完整可编辑数据(节点 + 选项,含跳转/主题/经理)
// - 批量保存节点与选项编辑(输入表格 + 保存按钮)
//
// 数据约束:
// - 每节点 <=4 选项(A/B/C/D 单选)
// - P3 选项为终点(target_node_id = null),关联主题与经理
// - P1/P2 选项跳转到下一节点(target_node_id 非空)

import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { quizNodes, quizEdges, quizTemplates } from "@/lib/db/schema";

// 可编辑节点数据(输入表格用)
export type EditableNode = {
  id: string;
  level: string;
  question: string;
  parentId: string | null;
  options: EditableOption[];
};

// 可编辑选项数据
export type EditableOption = {
  id: string;
  optionLabel: string;
  optionText: string;
  targetNodeId: string | null;
  resultTheme: string | null;
  resultManagerId: string | null;
  // 是否启用(C/D 可关闭):关闭后不参与问卷/节点图/链接生成
  isEnabled: boolean;
};

// 节点保存数据
export type NodeSave = {
  id: string;
  question: string;
};

// 选项保存数据
export type OptionSave = {
  id: string;
  optionText: string;
  targetNodeId: string | null;
  resultTheme: string | null;
  resultManagerId: string | null;
  // 是否启用(C/D 可关闭)
  isEnabled: boolean;
};

/**
 * 获取模板完整可编辑数据(节点按层级排序,选项按 sortOrder 排序)
 *
 * @param templateId Quiz 模板 ID
 * @returns 可编辑节点列表,模板不存在返回 null
 */
export async function getEditableTemplate(
  templateId: string
): Promise<EditableNode[] | null> {
  const templates = await db
    .select()
    .from(quizTemplates)
    .where(eq(quizTemplates.id, templateId))
    .limit(1);

  if (templates.length === 0) {
    return null;
  }

  const nodes = await db
    .select()
    .from(quizNodes)
    .where(eq(quizNodes.templateId, templateId))
    .orderBy(quizNodes.sortOrder);

  const nodeIds = nodes.map((n) => n.id);
  const edges = nodeIds.length
    ? await db
        .select()
        .from(quizEdges)
        .where(inArray(quizEdges.nodeId, nodeIds))
    : [];

  // 按节点分组选项
  const edgesByNode = new Map<string, EditableOption[]>();
  for (const edge of edges) {
    const list = edgesByNode.get(edge.nodeId) ?? [];
    list.push({
      id: edge.id,
      optionLabel: edge.optionLabel,
      optionText: edge.optionText,
      targetNodeId: edge.targetNodeId,
      resultTheme: edge.resultTheme,
      resultManagerId: edge.resultManagerId,
      isEnabled: edge.isEnabled,
    });
    edgesByNode.set(edge.nodeId, list);
  }

  return nodes.map((node) => ({
    id: node.id,
    level: node.level,
    question: node.question,
    parentId: node.parentId,
    options: (edgesByNode.get(node.id) ?? []).sort(
      (a, b) => a.optionLabel.localeCompare(b.optionLabel)
    ),
  }));
}

/**
 * 批量保存模板编辑(节点问题 + 选项文本/跳转/主题/经理)
 *
 * 使用事务保证原子性;更新按 id 匹配,不存在则跳过
 *
 * @param templateId Quiz 模板 ID
 * @param nodeSaves 节点更新
 * @param optionSaves 选项更新
 */
export async function saveTemplateEdits(
  templateId: string,
  nodeSaves: NodeSave[],
  optionSaves: OptionSave[]
): Promise<void> {
  // 校验该模板存在
  const templates = await db
    .select({ id: quizTemplates.id })
    .from(quizTemplates)
    .where(eq(quizTemplates.id, templateId))
    .limit(1);

  if (templates.length === 0) {
    throw new Error(`Quiz 模板不存在: ${templateId}`);
  }

  // 查询模板所有节点与选项 id(用于校验归属)
  const nodes = await db
    .select({ id: quizNodes.id })
    .from(quizNodes)
    .where(eq(quizNodes.templateId, templateId));
  const nodeIds = new Set(nodes.map((n) => n.id));

  const edges = nodeIds.size
    ? await db
        .select({ id: quizEdges.id, nodeId: quizEdges.nodeId })
        .from(quizEdges)
        .where(inArray(quizEdges.nodeId, Array.from(nodeIds)))
    : [];
  const edgeIds = new Set(edges.map((e) => e.id));

  await db.transaction(async (tx) => {
    // 更新节点问题
    for (const save of nodeSaves) {
      if (!nodeIds.has(save.id)) {
        continue; // 非本模板节点,跳过
      }
      await tx
        .update(quizNodes)
        .set({ question: save.question })
        .where(eq(quizNodes.id, save.id));
    }

    // 更新选项
    for (const save of optionSaves) {
      if (!edgeIds.has(save.id)) {
        continue; // 非本模板选项,跳过
      }
      await tx
        .update(quizEdges)
        .set({
          optionText: save.optionText,
          targetNodeId: save.targetNodeId,
          resultTheme: save.resultTheme,
          resultManagerId: save.resultManagerId,
          isEnabled: save.isEnabled,
        })
        .where(eq(quizEdges.id, save.id));
    }
  });
}
