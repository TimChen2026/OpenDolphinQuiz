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

// Quiz 模块共享类型定义(服务端与客户端通用)

// 客户端使用的 Quiz 选项类型(扁平结构,便于 React 状态管理)
export type QuizClientOption = {
  id: string;
  label: "A" | "B" | "C" | "D";
  text: string;
  targetNodeId: string | null; // P3 选项指向 P4 结果节点;P4 无选项
  resultTheme: string | null;
  resultManagerId: string | null;
};

// 客户端使用的 Quiz 节点类型(包含其所有选项)
export type QuizClientNode = {
  id: string;
  level: "P1" | "P2" | "P3" | "P4";
  question: string;
  options: QuizClientOption[];
};

// 客户端使用的 Quiz 模板类型(节点以 ID 索引,便于 O(1) 查找)
export type QuizClientTemplate = {
  id: string;
  name: string;
  description: string | null;
  rootNodeId: string;
  nodes: Record<string, QuizClientNode>;
};

// 用户选择路径记录(用于 Summary 页展示)
export type QuizPathEntry = {
  nodeId: string;
  nodeLevel: "P1" | "P2" | "P3";
  nodeQuestion: string;
  optionId: string;
  optionLabel: "A" | "B" | "C" | "D";
  optionText: string;
};

// Quiz 完成后的最终结果(最后一个 P3 选项的关联信息)
export type QuizResult = {
  theme: string | null;
  managerId: string | null;
  path: QuizPathEntry[];
};

// ==================== DB 记录类型(从 schema 推断) ====================

export type QuizTemplateRecord = {
  id: string;
  name: string;
  description: string | null;
};

export type QuizNodeRecord = {
  id: string;
  templateId: string;
  parentId: string | null;
  level: string;
  question: string;
  sortOrder: number;
  resultTheme: string | null;
  resultManagerId: string | null;
};

export type QuizEdgeRecord = {
  id: string;
  nodeId: string;
  optionLabel: string;
  optionText: string;
  targetNodeId: string | null;
  sortOrder: number;
  resultTheme: string | null;
  resultManagerId: string | null;
};

// 选项标签类型
type OptionLabel = "A" | "B" | "C" | "D";

// 节点层级类型
type NodeLevel = "P1" | "P2" | "P3" | "P4";

/**
 * 将 DB 记录转换为客户端模板结构
 *
 * 转换逻辑:
 * 1. 找到 parentId 为 null 的根节点
 * 2. 将节点按 ID 索引存储
 * 3. 将边按 nodeId 分组并附加到对应节点的 options 数组
 * 4. 选项按 sortOrder 升序排序
 *
 * @param template 模板记录
 * @param nodes 节点记录数组
 * @param edges 选项边记录数组
 * @returns 客户端模板结构(含根节点 ID 与节点索引)
 * @throws 无根节点时抛出错误
 */
export function buildClientTemplate(
  template: QuizTemplateRecord,
  nodes: QuizNodeRecord[],
  edges: QuizEdgeRecord[]
): QuizClientTemplate {
  // 查找根节点(parentId 为 null)
  const rootNode = nodes.find((n) => n.parentId === null);
  if (!rootNode) {
    throw new Error("Quiz 模板缺少根节点(parentId 为 null 的节点)");
  }

  // 按 nodeId 分组边
  const edgesByNodeId = new Map<string, QuizEdgeRecord[]>();
  for (const edge of edges) {
    const list = edgesByNodeId.get(edge.nodeId) ?? [];
    list.push(edge);
    edgesByNodeId.set(edge.nodeId, list);
  }

  // 构建节点索引
  const nodesById: Record<string, QuizClientNode> = {};
  for (const node of nodes) {
    const nodeEdges = (edgesByNodeId.get(node.id) ?? []).slice().sort(
      (a, b) => a.sortOrder - b.sortOrder
    );

    const options: QuizClientOption[] = nodeEdges.map((edge) => ({
      id: edge.id,
      label: edge.optionLabel as OptionLabel,
      text: edge.optionText,
      targetNodeId: edge.targetNodeId,
      resultTheme: edge.resultTheme,
      resultManagerId: edge.resultManagerId,
    }));

    nodesById[node.id] = {
      id: node.id,
      level: node.level as NodeLevel,
      question: node.question,
      options,
    };
  }

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    rootNodeId: rootNode.id,
    nodes: nodesById,
  };
}
