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

// listTemplateThemes 可达主题过滤回归测试:
// 团队页只应展示「从根节点沿启用选项可达」的 P3 主题,
// 用户在 Logic 界面关闭选项后,被隔离子树的主题必须被过滤

import { describe, it, expect, vi } from "vitest";
import { quizNodes, quizEdges } from "@/lib/db/schema";

// 模板树结构: P1(A/B) → P2(A/B) → P3(A/B,边带主题) → P4(结果节点,无边)
// P1-B 分支与 P2A-B 选项的主题在关闭后不应出现
const templateNodes = [
  { id: "p1", parentId: null, level: "P1" },
  { id: "p2a", parentId: "p1", level: "P2" },
  { id: "p2b", parentId: "p1", level: "P2" },
  { id: "p3aa", parentId: "p2a", level: "P3" },
  { id: "p3ab", parentId: "p2a", level: "P3" },
  { id: "p3ba", parentId: "p2b", level: "P3" },
  { id: "p3bb", parentId: "p2b", level: "P3" },
  { id: "p4aa", parentId: "p3aa", level: "P4" },
];

type EdgeRow = {
  nodeId: string;
  targetNodeId: string | null;
  resultTheme: string | null;
  isEnabled: boolean;
};

const baseEdges: EdgeRow[] = [
  { nodeId: "p1", targetNodeId: "p2a", resultTheme: null, isEnabled: true },
  { nodeId: "p1", targetNodeId: "p2b", resultTheme: null, isEnabled: true },
  { nodeId: "p2a", targetNodeId: "p3aa", resultTheme: null, isEnabled: true },
  { nodeId: "p2a", targetNodeId: "p3ab", resultTheme: null, isEnabled: true },
  { nodeId: "p2b", targetNodeId: "p3ba", resultTheme: null, isEnabled: true },
  { nodeId: "p2b", targetNodeId: "p3bb", resultTheme: null, isEnabled: true },
  { nodeId: "p3aa", targetNodeId: "p4aa", resultTheme: "Reading", isEnabled: true },
  { nodeId: "p3aa", targetNodeId: null, resultTheme: "Writing", isEnabled: true },
  { nodeId: "p3ab", targetNodeId: null, resultTheme: "Speaking", isEnabled: true },
  { nodeId: "p3ba", targetNodeId: null, resultTheme: "Math", isEnabled: true },
  { nodeId: "p3bb", targetNodeId: null, resultTheme: "Art", isEnabled: true },
];

let edgesData: EdgeRow[] = baseEdges;

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockImplementation((table: unknown) => ({
        where: vi.fn().mockImplementation(() => {
          if (table === quizNodes) {
            return Promise.resolve(templateNodes);
          }
          if (table === quizEdges) {
            return Promise.resolve(edgesData);
          }
          return Promise.resolve([]);
        }),
      })),
    })),
  },
}));

import { listTemplateThemes } from "@/lib/dashboard/team";

describe("listTemplateThemes", () => {
  it("全部选项启用时返回所有可达 P3 主题(去重)", async () => {
    edgesData = baseEdges;
    const themes = await listTemplateThemes("tpl-1");
    expect(themes).toEqual(["Reading", "Writing", "Speaking", "Math", "Art"]);
  });

  it("关闭 P1-B 分支后,该子树主题(Math/Art)被过滤", async () => {
    edgesData = baseEdges.map((e) =>
      e.nodeId === "p1" && e.targetNodeId === "p2b"
        ? { ...e, isEnabled: false }
        : e
    );
    const themes = await listTemplateThemes("tpl-1");
    expect(themes).toEqual(["Reading", "Writing", "Speaking"]);
  });

  it("关闭单个 P3 选项后,仅该选项的主题被过滤", async () => {
    edgesData = baseEdges.map((e) =>
      e.nodeId === "p3aa" && e.resultTheme === "Reading"
        ? { ...e, isEnabled: false }
        : e
    );
    const themes = await listTemplateThemes("tpl-1");
    expect(themes).toEqual(["Writing", "Speaking", "Math", "Art"]);
  });

  it("模板缺少根节点时返回空数组", async () => {
    edgesData = [];
    const originalNodes = templateNodes.splice(0, templateNodes.length);
    try {
      const themes = await listTemplateThemes("tpl-1");
      expect(themes).toEqual([]);
    } finally {
      templateNodes.push(...originalNodes);
    }
  });
});
