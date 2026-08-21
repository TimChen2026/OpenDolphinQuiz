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
import {
  quizTemplates,
  quizNodes,
  quizEdges,
  QUIZ_TEMPLATE_STATUS,
  QUIZ_NODE_LEVELS,
  QUIZ_OPTION_LABELS,
} from "@/lib/db/schema";

describe("quiz schema", () => {
  describe("quiz_templates 表", () => {
    it("包含 id 字段", () => {
      expect(quizTemplates.id).toBeDefined();
    });

    it("包含 name 字段", () => {
      expect(quizTemplates.name).toBeDefined();
    });

    it("包含 description 字段", () => {
      expect(quizTemplates.description).toBeDefined();
    });

    it("包含 tenant_id 字段(多租户隔离)", () => {
      expect(quizTemplates.tenantId).toBeDefined();
    });

    it("包含 status 字段", () => {
      expect(quizTemplates.status).toBeDefined();
    });

    it("包含 created_at 字段", () => {
      expect(quizTemplates.createdAt).toBeDefined();
    });

    it("包含 updated_at 字段", () => {
      expect(quizTemplates.updatedAt).toBeDefined();
    });
  });

  describe("quiz_nodes 表", () => {
    it("包含 id 字段", () => {
      expect(quizNodes.id).toBeDefined();
    });

    it("包含 template_id 字段(FK → quiz_templates)", () => {
      expect(quizNodes.templateId).toBeDefined();
    });

    it("包含 parent_id 字段(自引用,根节点为 null)", () => {
      expect(quizNodes.parentId).toBeDefined();
    });

    it("包含 level 字段(P1/P2/P3)", () => {
      expect(quizNodes.level).toBeDefined();
    });

    it("包含 question 字段", () => {
      expect(quizNodes.question).toBeDefined();
    });

    it("包含 sort_order 字段", () => {
      expect(quizNodes.sortOrder).toBeDefined();
    });

    it("包含 result_theme 字段(P3 节点默认主题)", () => {
      expect(quizNodes.resultTheme).toBeDefined();
    });

    it("包含 result_manager_id 字段(P3 节点默认经理)", () => {
      expect(quizNodes.resultManagerId).toBeDefined();
    });

    it("包含 created_at 字段", () => {
      expect(quizNodes.createdAt).toBeDefined();
    });

    it("包含 updated_at 字段", () => {
      expect(quizNodes.updatedAt).toBeDefined();
    });
  });

  describe("quiz_edges 表", () => {
    it("包含 id 字段", () => {
      expect(quizEdges.id).toBeDefined();
    });

    it("包含 node_id 字段(FK → quiz_nodes)", () => {
      expect(quizEdges.nodeId).toBeDefined();
    });

    it("包含 option_label 字段(A/B/C/D)", () => {
      expect(quizEdges.optionLabel).toBeDefined();
    });

    it("包含 option_text 字段", () => {
      expect(quizEdges.optionText).toBeDefined();
    });

    it("包含 target_node_id 字段(P3 终点选项为 null)", () => {
      expect(quizEdges.targetNodeId).toBeDefined();
    });

    it("包含 sort_order 字段", () => {
      expect(quizEdges.sortOrder).toBeDefined();
    });

    it("包含 result_theme 字段(选项级覆盖节点默认)", () => {
      expect(quizEdges.resultTheme).toBeDefined();
    });

    it("包含 result_manager_id 字段(选项级覆盖节点默认)", () => {
      expect(quizEdges.resultManagerId).toBeDefined();
    });

    it("包含 created_at 字段", () => {
      expect(quizEdges.createdAt).toBeDefined();
    });

    it("包含 updated_at 字段", () => {
      expect(quizEdges.updatedAt).toBeDefined();
    });
  });

  describe("常量定义", () => {
    it("QUIZ_TEMPLATE_STATUS 包含三种状态", () => {
      expect(QUIZ_TEMPLATE_STATUS.DRAFT).toBe("draft");
      expect(QUIZ_TEMPLATE_STATUS.ACTIVE).toBe("active");
      expect(QUIZ_TEMPLATE_STATUS.ARCHIVED).toBe("archived");
    });

    it("QUIZ_NODE_LEVELS 包含四层节点", () => {
      expect(QUIZ_NODE_LEVELS.P1).toBe("P1");
      expect(QUIZ_NODE_LEVELS.P2).toBe("P2");
      expect(QUIZ_NODE_LEVELS.P3).toBe("P3");
      expect(QUIZ_NODE_LEVELS.P4).toBe("P4");
    });

    it("QUIZ_OPTION_LABELS 包含四个选项", () => {
      expect(QUIZ_OPTION_LABELS.A).toBe("A");
      expect(QUIZ_OPTION_LABELS.B).toBe("B");
      expect(QUIZ_OPTION_LABELS.C).toBe("C");
      expect(QUIZ_OPTION_LABELS.D).toBe("D");
    });
  });
});
