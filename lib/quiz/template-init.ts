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

import { db } from "@/lib/db";
import { quizTemplates, quizNodes, quizEdges } from "@/lib/db/schema";

// 默认 Quiz 模板的 4 种主题(对应需求文档中的 数学/语文/英语/绘画)
const DEFAULT_THEMES = ["数学", "语文", "英语", "绘画"] as const;

// 4 个选项标签
const OPTION_LABELS = ["A", "B", "C", "D"] as const;

// 默认模板节点记录类型(便于测试与插入分离)
export type DefaultNodeRecord = {
  id: string;
  templateId: string;
  parentId: string | null;
  level: "P1" | "P2" | "P3" | "P4";
  question: string;
  sortOrder: number;
  resultTheme: string | null;
  resultManagerId: string | null;
};

// 默认模板选项边记录类型
export type DefaultEdgeRecord = {
  id: string;
  nodeId: string;
  optionLabel: "A" | "B" | "C" | "D";
  optionText: string;
  targetNodeId: string | null;
  sortOrder: number;
  resultTheme: string | null;
  resultManagerId: string | null;
};

// 默认模板完整数据结构
export type DefaultQuizTemplateData = {
  template: {
    id: string;
    name: string;
    description: string;
    tenantId: string;
    status: string;
  };
  nodes: DefaultNodeRecord[];
  edges: DefaultEdgeRecord[];
};

/**
 * 构建默认 Quiz 模板数据(85 节点 + 84 选项边 + 64 种最终选择路径)
 *
 * 结构(附件3 Quiz问答逻辑表 V2.0.xlsx):
 * - 1 个 P1 根节点(4 选项 → 4 个 P2)
 * - 4 个 P2 中间节点(每个 4 选项 → 16 个 P3)
 * - 16 个 P3 选择节点(每个 4 选项 → 64 个 P4)
 * - 64 个 P4 结果节点(展示 Summary 摘要,无选项,终点)
 *
 * 主题关联(选项级):
 * - P3 节点的每个选项分别关联一种主题(数学/语文/英语/绘画)
 * - P1/P2 节点的选项不关联主题
 * - P4 结果节点继承其 P3 选项的主题(用于逻辑界面展示)
 *
 * 占位符设计:
 * - 问题和选项文本使用占位符(如"请输入 P1 根节点问题"),用户在 Dashboard 编辑实际内容
 * - result_manager_id 留空,待 Dashboard 关联销售经理
 *
 * @param templateId 模板 ID
 * @param tenantId 租户 ID(= user.id)
 * @param options 可选:模板名称与描述
 */
export function buildDefaultQuizTemplateData(
  templateId: string,
  tenantId: string,
  options?: { name?: string; description?: string }
): DefaultQuizTemplateData {
  const name = options?.name ?? "默认 Quiz 模板";
  const description =
    options?.description ?? "85 节点决策树模板,请在 Dashboard 中编辑实际内容";

  const nodes: DefaultNodeRecord[] = [];
  const edges: DefaultEdgeRecord[] = [];

  // ===== P1 根节点 =====
  const p1Id = `${templateId}-p1`;
  nodes.push({
    id: p1Id,
    templateId,
    parentId: null,
    level: "P1",
    question: "请输入 P1 根节点问题",
    sortOrder: 0,
    resultTheme: null,
    resultManagerId: null,
  });

  // P1 的 4 个选项 → 指向 4 个 P2 节点
  OPTION_LABELS.forEach((label, index) => {
    const p2Id = `${templateId}-p2-${label.toLowerCase()}`;
    edges.push({
      id: `${templateId}-edge-p1-${label.toLowerCase()}`,
      nodeId: p1Id,
      optionLabel: label,
      optionText: `请输入 P1 选项 ${label} 文本`,
      targetNodeId: p2Id,
      sortOrder: index,
      resultTheme: null,
      resultManagerId: null,
    });
  });

  // ===== P2 中间节点(4 个) =====
  OPTION_LABELS.forEach((p2Label, p2Index) => {
    const p2Id = `${templateId}-p2-${p2Label.toLowerCase()}`;

    nodes.push({
      id: p2Id,
      templateId,
      parentId: p1Id,
      level: "P2",
      question: `请输入 P2-${p2Label} 中间节点问题`,
      sortOrder: p2Index,
      resultTheme: null,
      resultManagerId: null,
    });

    // 当前 P2 节点的 4 个选项 → 指向 4 个 P3 节点
    OPTION_LABELS.forEach((p3Label, p3Index) => {
      const p3Id = `${templateId}-p3-${p2Label.toLowerCase()}${p3Label.toLowerCase()}`;
      edges.push({
        id: `${templateId}-edge-p2-${p2Label.toLowerCase()}-${p3Label.toLowerCase()}`,
        nodeId: p2Id,
        optionLabel: p3Label,
        optionText: `请输入 P2-${p2Label} 选项 ${p3Label} 文本`,
        targetNodeId: p3Id,
        sortOrder: p3Index,
        resultTheme: null,
        resultManagerId: null,
      });
    });
  });

  // ===== P3 选择节点(16 个,每个对应 P2 选项 × P3 标签的组合) =====
  OPTION_LABELS.forEach((p2Label, p2Index) => {
    OPTION_LABELS.forEach((p3Label, p3Index) => {
      const p3Id = `${templateId}-p3-${p2Label.toLowerCase()}${p3Label.toLowerCase()}`;
      const p2Id = `${templateId}-p2-${p2Label.toLowerCase()}`;

      nodes.push({
        id: p3Id,
        templateId,
        parentId: p2Id,
        level: "P3",
        question: `请输入 P3-${p2Label}${p3Label} 选择节点问题`,
        sortOrder: p2Index * 4 + p3Index,
        resultTheme: null,
        resultManagerId: null,
      });

      // P3 的 4 个选项 → 指向 4 个 P4 结果节点(64 种最终选择)
      // 每个选项关联一种主题(选项级关联,覆盖节点级默认值)
      OPTION_LABELS.forEach((optionLabel, optionIndex) => {
        const p4Id = `${templateId}-p4-${p2Label.toLowerCase()}${p3Label.toLowerCase()}${optionLabel.toLowerCase()}`;
        edges.push({
          id: `${templateId}-edge-p3-${p2Label.toLowerCase()}${p3Label.toLowerCase()}-${optionLabel.toLowerCase()}`,
          nodeId: p3Id,
          optionLabel: optionLabel,
          optionText: `请输入 P3-${p2Label}${p3Label} 选项 ${optionLabel} 文本`,
          targetNodeId: p4Id, // P3 选项 → P4 结果节点
          sortOrder: optionIndex,
          resultTheme: DEFAULT_THEMES[optionIndex], // 选项级主题占位符
          resultManagerId: null, // 待 Dashboard 关联销售经理
        });

        // P4 结果节点:展示 Summary 摘要,无选项(终点)
        nodes.push({
          id: p4Id,
          templateId,
          parentId: p3Id,
          level: "P4",
          question: `P4-${p2Label}${p3Label}${optionLabel} 结果节点(Summary 摘要)`,
          sortOrder: optionIndex,
          resultTheme: DEFAULT_THEMES[optionIndex], // 继承 P3 选项主题
          resultManagerId: null,
        });
      });
    });
  });

  return {
    template: {
      id: templateId,
      name,
      description,
      tenantId,
      status: "draft",
    },
    nodes,
    edges,
  };
}

/**
 * 在数据库中创建默认 Quiz 模板
 *
 * 流程:
 * 1. 生成模板 ID
 * 2. 构建完整的 21 节点 + 84 选项边数据
 * 3. 在事务中插入模板、节点、边
 *
 * @param tenantId 租户 ID(= user.id)
 * @param options 可选:模板名称与描述
 * @returns 新创建的模板 ID
 */
export async function createDefaultQuizTemplate(
  tenantId: string,
  options?: { name?: string; description?: string }
): Promise<string> {
  const templateId = crypto.randomUUID();
  const data = buildDefaultQuizTemplateData(templateId, tenantId, options);

  await db.transaction(async (tx) => {
    await tx.insert(quizTemplates).values(data.template);
    await tx.insert(quizNodes).values(data.nodes);
    await tx.insert(quizEdges).values(data.edges);
  });

  return templateId;
}
