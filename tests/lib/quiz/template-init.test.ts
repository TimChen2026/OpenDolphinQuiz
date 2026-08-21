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
import { buildDefaultQuizTemplateData } from "@/lib/quiz/template-init";

describe("buildDefaultQuizTemplateData", () => {
  const templateId = "tpl-test-001";
  const tenantId = "tenant-test-001";

  const data = buildDefaultQuizTemplateData(templateId, tenantId);

  describe("模板基本信息", () => {
    it("模板 ID 与传入参数一致", () => {
      expect(data.template.id).toBe(templateId);
    });

    it("租户 ID 与传入参数一致", () => {
      expect(data.template.tenantId).toBe(tenantId);
    });

    it("默认模板名称为'默认 Quiz 模板'", () => {
      expect(data.template.name).toBe("默认 Quiz 模板");
    });

    it("默认状态为 draft", () => {
      expect(data.template.status).toBe("draft");
    });
  });

  describe("节点数量与层级分布", () => {
    it("总节点数为 85(1 P1 + 4 P2 + 16 P3 + 64 P4)", () => {
      expect(data.nodes).toHaveLength(85);
    });

    it("P1 根节点数量为 1", () => {
      const p1Nodes = data.nodes.filter((n) => n.level === "P1");
      expect(p1Nodes).toHaveLength(1);
    });

    it("P2 中间节点数量为 4", () => {
      const p2Nodes = data.nodes.filter((n) => n.level === "P2");
      expect(p2Nodes).toHaveLength(4);
    });

    it("P3 选择节点数量为 16", () => {
      const p3Nodes = data.nodes.filter((n) => n.level === "P3");
      expect(p3Nodes).toHaveLength(16);
    });

    it("P4 结果节点数量为 64", () => {
      const p4Nodes = data.nodes.filter((n) => n.level === "P4");
      expect(p4Nodes).toHaveLength(64);
    });

    it("所有节点 ID 唯一", () => {
      const ids = data.nodes.map((n) => n.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("P1 根节点结构", () => {
    const p1Node = data.nodes.find((n) => n.level === "P1");

    it("P1 节点存在", () => {
      expect(p1Node).toBeDefined();
    });

    it("P1 节点 parentId 为 null", () => {
      expect(p1Node?.parentId).toBeNull();
    });

    it("P1 节点 resultTheme 为 null(P1/P2 节点不关联主题)", () => {
      expect(p1Node?.resultTheme).toBeNull();
    });

    it("P1 节点 resultManagerId 为 null", () => {
      expect(p1Node?.resultManagerId).toBeNull();
    });

    it("P1 节点 question 为占位符文本", () => {
      expect(p1Node?.question).toContain("P1");
    });
  });

  describe("P2 中间节点结构", () => {
    const p2Nodes = data.nodes.filter((n) => n.level === "P2");

    it("所有 P2 节点 parentId 指向 P1", () => {
      const p1Node = data.nodes.find((n) => n.level === "P1");
      p2Nodes.forEach((p2) => {
        expect(p2.parentId).toBe(p1Node?.id);
      });
    });

    it("所有 P2 节点 resultTheme 为 null", () => {
      p2Nodes.forEach((p2) => {
        expect(p2.resultTheme).toBeNull();
      });
    });
  });

  describe("P3 选择节点结构", () => {
    const p3Nodes = data.nodes.filter((n) => n.level === "P3");

    it("每个 P3 节点的 parentId 指向对应的 P2 节点", () => {
      const p2Nodes = data.nodes.filter((n) => n.level === "P2");
      p3Nodes.forEach((p3) => {
        expect(p2Nodes.map((p2) => p2.id)).toContain(p3.parentId);
      });
    });

    it("16 个 P3 节点分别对应 AA/AB/.../DD 路径", () => {
      const labels = ["A", "B", "C", "D"];
      const expectedPaths = labels.flatMap((p2) =>
        labels.map((p3) => `${p2}${p3}`)
      );
      // 验证 16 种路径都被覆盖(通过 question 占位符中包含路径标识)
      p3Nodes.forEach((p3) => {
        const pathMatch = p3.question.match(/P3-([A-D])([A-D])/);
        expect(pathMatch).not.toBeNull();
        const path = pathMatch![1] + pathMatch![2];
        expect(expectedPaths).toContain(path);
      });
    });
  });

  describe("P4 结果节点结构", () => {
    const p4Nodes = data.nodes.filter((n) => n.level === "P4");

    it("64 个 P4 节点的 parentId 指向对应的 P3 节点", () => {
      const p3Nodes = data.nodes.filter((n) => n.level === "P3");
      p4Nodes.forEach((p4) => {
        expect(p3Nodes.map((p3) => p3.id)).toContain(p4.parentId);
      });
    });

    it("P4 节点 resultTheme 继承其 P3 选项主题", () => {
      const validThemes = ["数学", "语文", "英语", "绘画"];
      p4Nodes.forEach((p4) => {
        expect(validThemes).toContain(p4.resultTheme);
      });
    });

    it("每个 P3 节点挂载 4 个 P4 子节点", () => {
      const p3Nodes = data.nodes.filter((n) => n.level === "P3");
      p3Nodes.forEach((p3) => {
        const children = p4Nodes.filter((p4) => p4.parentId === p3.id);
        expect(children).toHaveLength(4);
      });
    });
  });

  describe("选项边(Edges)数量与分布", () => {
    it("总边数为 84(4 P1 + 16 P2 + 64 P3)", () => {
      expect(data.edges).toHaveLength(84);
    });

    it("所有边 ID 唯一", () => {
      const ids = data.edges.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("P1 节点的边数为 4(指向 4 个 P2)", () => {
      const p1Node = data.nodes.find((n) => n.level === "P1");
      const p1Edges = data.edges.filter((e) => e.nodeId === p1Node?.id);
      expect(p1Edges).toHaveLength(4);
    });

    it("每个 P2 节点的边数为 4(指向 4 个 P3)", () => {
      const p2Nodes = data.nodes.filter((n) => n.level === "P2");
      p2Nodes.forEach((p2) => {
        const p2Edges = data.edges.filter((e) => e.nodeId === p2.id);
        expect(p2Edges).toHaveLength(4);
      });
    });

    it("每个 P3 节点的边数为 4(指向 4 个 P4 结果节点)", () => {
      const p3Nodes = data.nodes.filter((n) => n.level === "P3");
      p3Nodes.forEach((p3) => {
        const p3Edges = data.edges.filter((e) => e.nodeId === p3.id);
        expect(p3Edges).toHaveLength(4);
      });
    });
  });

  describe("选项标签与跳转关系", () => {
    it("每条边的 optionLabel 为 A/B/C/D 之一", () => {
      const validLabels = ["A", "B", "C", "D"];
      data.edges.forEach((edge) => {
        expect(validLabels).toContain(edge.optionLabel);
      });
    });

    it("每个 P1/P2/P3 节点的 4 条边分别对应 A/B/C/D", () => {
      const validLabels = ["A", "B", "C", "D"];
      data.nodes
        .filter((n) => n.level !== "P4") // P4 结果节点无选项
        .forEach((node) => {
          const nodeEdges = data.edges.filter((e) => e.nodeId === node.id);
          const labels = nodeEdges.map((e) => e.optionLabel).sort();
          expect(labels).toEqual(validLabels);
        });
    });

    it("P1 边的 targetNodeId 指向 P2 节点", () => {
      const p1Node = data.nodes.find((n) => n.level === "P1");
      const p2Ids = data.nodes
        .filter((n) => n.level === "P2")
        .map((n) => n.id);
      const p1Edges = data.edges.filter((e) => e.nodeId === p1Node?.id);
      p1Edges.forEach((edge) => {
        expect(edge.targetNodeId).not.toBeNull();
        expect(p2Ids).toContain(edge.targetNodeId);
      });
    });

    it("P2 边的 targetNodeId 指向 P3 节点", () => {
      const p2Nodes = data.nodes.filter((n) => n.level === "P2");
      const p3Ids = data.nodes
        .filter((n) => n.level === "P3")
        .map((n) => n.id);
      p2Nodes.forEach((p2) => {
        const p2Edges = data.edges.filter((e) => e.nodeId === p2.id);
        p2Edges.forEach((edge) => {
          expect(edge.targetNodeId).not.toBeNull();
          expect(p3Ids).toContain(edge.targetNodeId);
        });
      });
    });

    it("P3 边的 targetNodeId 指向 P4 结果节点", () => {
      const p3Nodes = data.nodes.filter((n) => n.level === "P3");
      const p4Ids = data.nodes
        .filter((n) => n.level === "P4")
        .map((n) => n.id);
      p3Nodes.forEach((p3) => {
        const p3Edges = data.edges.filter((e) => e.nodeId === p3.id);
        p3Edges.forEach((edge) => {
          expect(edge.targetNodeId).not.toBeNull();
          expect(p4Ids).toContain(edge.targetNodeId);
        });
      });
    });
  });

  describe("P3 选项的主题关联(选项级)", () => {
    const p3Nodes = data.nodes.filter((n) => n.level === "P3");

    it("P3 选项的 resultTheme 不为 null", () => {
      p3Nodes.forEach((p3) => {
        const p3Edges = data.edges.filter((e) => e.nodeId === p3.id);
        p3Edges.forEach((edge) => {
          expect(edge.resultTheme).not.toBeNull();
        });
      });
    });

    it("P3 选项的主题为 数学/语文/英语/绘画 之一", () => {
      const validThemes = ["数学", "语文", "英语", "绘画"];
      p3Nodes.forEach((p3) => {
        const p3Edges = data.edges.filter((e) => e.nodeId === p3.id);
        p3Edges.forEach((edge) => {
          expect(validThemes).toContain(edge.resultTheme);
        });
      });
    });

    it("每个 P3 节点的 4 个选项分别对应 4 种主题", () => {
      const validThemes = ["数学", "语文", "英语", "绘画"].sort();
      p3Nodes.forEach((p3) => {
        const p3Edges = data.edges.filter((e) => e.nodeId === p3.id);
        const themes = p3Edges.map((e) => e.resultTheme).sort();
        expect(themes).toEqual(validThemes);
      });
    });

    it("P1/P2 节点边的 resultTheme 为 null(仅 P3 选项关联主题)", () => {
      const p1P2Nodes = data.nodes.filter(
        (n) => n.level === "P1" || n.level === "P2"
      );
      p1P2Nodes.forEach((node) => {
        const nodeEdges = data.edges.filter((e) => e.nodeId === node.id);
        nodeEdges.forEach((edge) => {
          expect(edge.resultTheme).toBeNull();
        });
      });
    });
  });

  describe("跳转完整性验证", () => {
    it("P1 选 A 跳转到 P2-A 节点", () => {
      const p1Node = data.nodes.find((n) => n.level === "P1");
      const p2A = data.nodes.find(
        (n) => n.level === "P2" && n.question.includes("P2-A")
      );
      const edge = data.edges.find(
        (e) => e.nodeId === p1Node?.id && e.optionLabel === "A"
      );
      expect(edge?.targetNodeId).toBe(p2A?.id);
    });

    it("P2-A 选 A 跳转到 P3-AA 节点", () => {
      const p2A = data.nodes.find(
        (n) => n.level === "P2" && n.question.includes("P2-A")
      );
      const p3AA = data.nodes.find(
        (n) => n.level === "P3" && n.question.includes("P3-AA")
      );
      const edge = data.edges.find(
        (e) => e.nodeId === p2A?.id && e.optionLabel === "A"
      );
      expect(edge?.targetNodeId).toBe(p3AA?.id);
    });

    it("P3-DD 选 D 跳转到 P4-DDD 结果节点(主题为绘画)", () => {
      const p3DD = data.nodes.find(
        (n) => n.level === "P3" && n.question.includes("P3-DD")
      );
      const p4DDD = data.nodes.find(
        (n) => n.level === "P4" && n.question.includes("P4-DDD")
      );
      const edge = data.edges.find(
        (e) => e.nodeId === p3DD?.id && e.optionLabel === "D"
      );
      expect(edge?.targetNodeId).toBe(p4DDD?.id);
      expect(edge?.resultTheme).toBe("绘画");
      expect(p4DDD?.resultTheme).toBe("绘画");
    });
  });
});
