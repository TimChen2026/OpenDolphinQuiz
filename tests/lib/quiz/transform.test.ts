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

import { describe, it, expect } from "vitest";
import { buildClientTemplate } from "@/lib/quiz/transform";
import type {
  QuizNodeRecord,
  QuizEdgeRecord,
  QuizTemplateRecord,
} from "@/lib/quiz/transform";

// 测试用数据:简化的 3 节点树(P1 → P2-A → P3-AA)
function buildTestData(): {
  template: QuizTemplateRecord;
  nodes: QuizNodeRecord[];
  edges: QuizEdgeRecord[];
} {
  const template: QuizTemplateRecord = {
    id: "tpl-001",
    name: "测试模板",
    description: "测试用模板",
  };

  const nodes: QuizNodeRecord[] = [
    {
      id: "node-p1",
      templateId: "tpl-001",
      parentId: null,
      level: "P1",
      question: "P1 问题",
      sortOrder: 0,
      resultTheme: null,
      resultManagerId: null,
    },
    {
      id: "node-p2-a",
      templateId: "tpl-001",
      parentId: "node-p1",
      level: "P2",
      question: "P2-A 问题",
      sortOrder: 0,
      resultTheme: null,
      resultManagerId: null,
    },
    {
      id: "node-p3-aa",
      templateId: "tpl-001",
      parentId: "node-p2-a",
      level: "P3",
      question: "P3-AA 问题",
      sortOrder: 0,
      resultTheme: null,
      resultManagerId: null,
    },
  ];

  const edges: QuizEdgeRecord[] = [
    {
      id: "edge-p1-a",
      nodeId: "node-p1",
      optionLabel: "A",
      optionText: "P1 选项 A",
      targetNodeId: "node-p2-a",
      sortOrder: 0,
      resultTheme: null,
      resultManagerId: null,
    },
    {
      id: "edge-p2-a-a",
      nodeId: "node-p2-a",
      optionLabel: "A",
      optionText: "P2-A 选项 A",
      targetNodeId: "node-p3-aa",
      sortOrder: 0,
      resultTheme: null,
      resultManagerId: null,
    },
    {
      id: "edge-p3-aa-a",
      nodeId: "node-p3-aa",
      optionLabel: "A",
      optionText: "P3-AA 选项 A",
      targetNodeId: null,
      sortOrder: 0,
      resultTheme: "数学",
      resultManagerId: "manager-001",
    },
  ];

  return { template, nodes, edges };
}

describe("buildClientTemplate", () => {
  const { template, nodes, edges } = buildTestData();
  const clientTemplate = buildClientTemplate(template, nodes, edges);

  describe("模板基本信息", () => {
    it("包含模板 ID", () => {
      expect(clientTemplate.id).toBe("tpl-001");
    });

    it("包含模板名称", () => {
      expect(clientTemplate.name).toBe("测试模板");
    });

    it("包含模板描述", () => {
      expect(clientTemplate.description).toBe("测试用模板");
    });
  });

  describe("根节点识别", () => {
    it("rootNodeId 指向 P1 节点(parentId 为 null)", () => {
      expect(clientTemplate.rootNodeId).toBe("node-p1");
    });
  });

  describe("节点索引", () => {
    it("nodes 字段以节点 ID 为键", () => {
      expect(clientTemplate.nodes["node-p1"]).toBeDefined();
      expect(clientTemplate.nodes["node-p2-a"]).toBeDefined();
      expect(clientTemplate.nodes["node-p3-aa"]).toBeDefined();
    });

    it("每个节点包含 id/level/question 字段", () => {
      const p1 = clientTemplate.nodes["node-p1"];
      expect(p1.id).toBe("node-p1");
      expect(p1.level).toBe("P1");
      expect(p1.question).toBe("P1 问题");
    });

    it("每个节点包含 options 数组", () => {
      const p1 = clientTemplate.nodes["node-p1"];
      expect(Array.isArray(p1.options)).toBe(true);
      expect(p1.options).toHaveLength(1);
    });
  });

  describe("选项组装", () => {
    it("P1 节点的选项包含正确的 targetNodeId", () => {
      const p1 = clientTemplate.nodes["node-p1"];
      const optionA = p1.options[0];
      expect(optionA.targetNodeId).toBe("node-p2-a");
    });

    it("P3 节点的选项 targetNodeId 为 null(终点)", () => {
      const p3 = clientTemplate.nodes["node-p3-aa"];
      const optionA = p3.options[0];
      expect(optionA.targetNodeId).toBeNull();
    });

    it("P3 节点的选项包含 resultTheme", () => {
      const p3 = clientTemplate.nodes["node-p3-aa"];
      const optionA = p3.options[0];
      expect(optionA.resultTheme).toBe("数学");
    });

    it("选项按 sortOrder 排序", () => {
      // 添加多条边测试排序
      const multiEdgeNodes: QuizNodeRecord[] = [
        {
          id: "node-multi",
          templateId: "tpl-002",
          parentId: null,
          level: "P1",
          question: "多选项节点",
          sortOrder: 0,
          resultTheme: null,
          resultManagerId: null,
        },
      ];
      const multiEdges: QuizEdgeRecord[] = [
        {
          id: "edge-multi-c",
          nodeId: "node-multi",
          optionLabel: "C",
          optionText: "选项 C",
          targetNodeId: null,
          sortOrder: 2,
          resultTheme: null,
          resultManagerId: null,
        },
        {
          id: "edge-multi-a",
          nodeId: "node-multi",
          optionLabel: "A",
          optionText: "选项 A",
          targetNodeId: null,
          sortOrder: 0,
          resultTheme: null,
          resultManagerId: null,
        },
        {
          id: "edge-multi-b",
          nodeId: "node-multi",
          optionLabel: "B",
          optionText: "选项 B",
          targetNodeId: null,
          sortOrder: 1,
          resultTheme: null,
          resultManagerId: null,
        },
      ];
      const result = buildClientTemplate(
        { id: "tpl-002", name: "t", description: null },
        multiEdgeNodes,
        multiEdges
      );
      const options = result.nodes["node-multi"].options;
      expect(options.map((o) => o.label)).toEqual(["A", "B", "C"]);
    });
  });

  describe("空数据与异常处理", () => {
    it("无根节点时抛出错误", () => {
      expect(() =>
        buildClientTemplate(
          { id: "tpl-empty", name: "空", description: null },
          [],
          []
        )
      ).toThrow(/根节点/);
    });

    it("节点没有选项时返回空 options 数组", () => {
      const lonelyNode: QuizNodeRecord[] = [
        {
          id: "lonely",
          templateId: "tpl-003",
          parentId: null,
          level: "P1",
          question: "无选项节点",
          sortOrder: 0,
          resultTheme: null,
          resultManagerId: null,
        },
      ];
      const result = buildClientTemplate(
        { id: "tpl-003", name: "t", description: null },
        lonelyNode,
        []
      );
      expect(result.nodes["lonely"].options).toEqual([]);
    });
  });
});
