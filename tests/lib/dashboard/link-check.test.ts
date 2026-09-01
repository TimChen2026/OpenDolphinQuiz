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
 * along with DolphinQuiz.  If not, see <https://www.gnu.org/licenses/>.
 */

// link-check 可达性校验回归测试:
// 已关闭选项(C/D off)隔离的子树不参与链接生成,必须整体跳过完整性校验

import { describe, expect, it } from "vitest";
import { validateReachableNodes } from "@/lib/dashboard/link-check";
import type { EditableNode } from "@/lib/dashboard/quiz-editor";

function makeOption(
  overrides: Partial<EditableNode["options"][number]> & { optionLabel: string }
): EditableNode["options"][number] {
  return {
    id: `opt-${overrides.optionLabel}`,
    optionText: "已填写的选项文本",
    targetNodeId: null,
    resultTheme: "主题词",
    resultManagerId: "manager-001",
    isEnabled: true,
    ...overrides,
  };
}

function makeNode(
  overrides: Partial<EditableNode> & { id: string; level: string }
): EditableNode {
  return {
    question: "已填写的问题",
    parentId: null,
    options: [],
    ...overrides,
  };
}

describe("validateReachableNodes", () => {
  it("已关闭选项隔离的子树(P2-C 及其下级)整体跳过校验", () => {
    const nodes: EditableNode[] = [
      makeNode({
        id: "p1",
        level: "P1",
        question: "根问题",
        options: [
          makeOption({ optionLabel: "A", targetNodeId: "p2a" }),
          // C 选项已关闭:整棵 P2-C 子树不可达
          makeOption({
            optionLabel: "C",
            targetNodeId: "p2c",
            isEnabled: false,
          }),
        ],
      }),
      makeNode({
        id: "p2a",
        level: "P2",
        parentId: "p1",
        question: "P2-A 问题",
        options: [makeOption({ optionLabel: "A", targetNodeId: "p3aa" })],
      }),
      // P2-C 节点:问题与选项均为占位符,但不可达,不应报出
      makeNode({
        id: "p2c",
        level: "P2",
        parentId: "p1",
        question: "Please enter P2-C choice question",
        options: [
          makeOption({
            optionLabel: "A",
            optionText: "Please enter",
            targetNodeId: "p3ca",
          }),
        ],
      }),
      makeNode({
        id: "p3aa",
        level: "P3",
        parentId: "p2a",
        question: "P3-AA 问题",
        options: [makeOption({ optionLabel: "A", targetNodeId: null })],
      }),
      // P3-CA 节点:信息缺失,但位于不可达子树内,不应报出
      makeNode({
        id: "p3ca",
        level: "P3",
        parentId: "p2c",
        question: "Please enter P3-CA choice question",
        options: [
          makeOption({
            optionLabel: "A",
            optionText: "Please enter",
            resultTheme: null,
            resultManagerId: null,
          }),
        ],
      }),
    ];

    const issues = validateReachableNodes(nodes);
    expect(issues).toEqual([]);
  });

  it("可达节点内已关闭的选项跳过校验,启用选项缺失仍报出", () => {
    const nodes: EditableNode[] = [
      makeNode({
        id: "p1",
        level: "P1",
        question: "根问题",
        options: [
          makeOption({ optionLabel: "A", targetNodeId: "p2a" }),
          makeOption({
            optionLabel: "C",
            optionText: "Please enter",
            isEnabled: false,
          }),
        ],
      }),
      makeNode({
        id: "p2a",
        level: "P2",
        parentId: "p1",
        question: "P2-A 问题",
        options: [
          makeOption({
            optionLabel: "A",
            optionText: "Please enter",
            targetNodeId: null,
          }),
        ],
      }),
    ];

    const issues = validateReachableNodes(nodes);
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toBe("P2 node option A text has not been filled in");
  });

  it("可达 P3 选项缺主题词/销售经理仍报出", () => {
    const nodes: EditableNode[] = [
      makeNode({
        id: "p1",
        level: "P1",
        question: "根问题",
        options: [makeOption({ optionLabel: "A", targetNodeId: "p3a" })],
      }),
      makeNode({
        id: "p3a",
        level: "P3",
        parentId: "p1",
        question: "P3-A 问题",
        options: [
          makeOption({ optionLabel: "A", resultTheme: null, resultManagerId: null }),
        ],
      }),
    ];

    const issues = validateReachableNodes(nodes);
    expect(issues).toHaveLength(2);
    expect(issues.map((i) => i.message)).toEqual([
      "P3 node option A has no topic assigned",
      "P3 node option A has no sales manager assigned",
    ]);
  });
});
