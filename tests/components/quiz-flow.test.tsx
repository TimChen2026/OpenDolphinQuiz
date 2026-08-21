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

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuizFlow } from "@/features/quiz/components/quiz-flow";
import type { QuizClientTemplate } from "@/lib/quiz/transform";

// framer-motion mock(参考 tests/components/hero.test.tsx 模式)
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  motion: new Proxy(
    {},
    {
      get: (_target, tag) => {
        return (props: React.PropsWithChildren<Record<string, unknown>>) => {
          const {
            children,
            initial,
            animate,
            exit,
            transition,
            ...elementProps
          } = props;
          void initial;
          void animate;
          void exit;
          void transition;
          return React.createElement(
            typeof tag === "string" ? tag : "div",
            elementProps,
            children
          );
        };
      },
    }
  ),
}));

// auth-client mock(quiz-flow 通过 useSession 获取客户名/邮箱用于 Summary 渲染)
vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({
    data: {
      user: {
        id: "customer_001",
        name: "测试客户",
        email: "customer@example.com",
      },
    },
  }),
}));

// 构建测试用模板:P1 → P2-A → P3-AA → P4-AAA(每个节点 2 个选项,简化测试)
function buildTestTemplate(): QuizClientTemplate {
  return {
    id: "tpl-test",
    name: "测试模板",
    description: "测试",
    rootNodeId: "node-p1",
    nodes: {
      "node-p1": {
        id: "node-p1",
        level: "P1",
        question: "P1 问题文本",
        options: [
          {
            id: "edge-p1-a",
            label: "A",
            text: "P1 选项 A",
            targetNodeId: "node-p2-a",
            resultTheme: null,
            resultManagerId: null,
          },
          {
            id: "edge-p1-b",
            label: "B",
            text: "P1 选项 B",
            targetNodeId: "node-p2-b",
            resultTheme: null,
            resultManagerId: null,
          },
        ],
      },
      "node-p2-a": {
        id: "node-p2-a",
        level: "P2",
        question: "P2-A 问题文本",
        options: [
          {
            id: "edge-p2-a-a",
            label: "A",
            text: "P2-A 选项 A",
            targetNodeId: "node-p3-aa",
            resultTheme: null,
            resultManagerId: null,
          },
          {
            id: "edge-p2-a-b",
            label: "B",
            text: "P2-A 选项 B",
            targetNodeId: "node-p3-ab",
            resultTheme: null,
            resultManagerId: null,
          },
        ],
      },
      "node-p2-b": {
        id: "node-p2-b",
        level: "P2",
        question: "P2-B 问题文本",
        options: [
          {
            id: "edge-p2-b-a",
            label: "A",
            text: "P2-B 选项 A",
            targetNodeId: "node-p3-ba",
            resultTheme: null,
            resultManagerId: null,
          },
        ],
      },
      "node-p3-aa": {
        id: "node-p3-aa",
        level: "P3",
        question: "P3-AA 问题文本",
        options: [
          {
            id: "edge-p3-aa-a",
            label: "A",
            text: "P3-AA 选项 A",
            targetNodeId: "node-p4-aaa",
            resultTheme: "数学",
            resultManagerId: "manager-001",
          },
          {
            id: "edge-p3-aa-b",
            label: "B",
            text: "P3-AA 选项 B",
            targetNodeId: "node-p4-aab",
            resultTheme: "语文",
            resultManagerId: "manager-002",
          },
        ],
      },
      "node-p3-ab": {
        id: "node-p3-ab",
        level: "P3",
        question: "P3-AB 问题文本",
        options: [
          {
            id: "edge-p3-ab-a",
            label: "A",
            text: "P3-AB 选项 A",
            targetNodeId: "node-p4-aba",
            resultTheme: "英语",
            resultManagerId: null,
          },
        ],
      },
      "node-p3-ba": {
        id: "node-p3-ba",
        level: "P3",
        question: "P3-BA 问题文本",
        options: [
          {
            id: "edge-p3-ba-a",
            label: "A",
            text: "P3-BA 选项 A",
            targetNodeId: "node-p4-baa",
            resultTheme: "绘画",
            resultManagerId: null,
          },
        ],
      },
      "node-p4-aaa": {
        id: "node-p4-aaa",
        level: "P4",
        question: "P4-AAA 结果节点",
        options: [],
      },
      "node-p4-aab": {
        id: "node-p4-aab",
        level: "P4",
        question: "P4-AAB 结果节点",
        options: [],
      },
      "node-p4-aba": {
        id: "node-p4-aba",
        level: "P4",
        question: "P4-ABA 结果节点",
        options: [],
      },
      "node-p4-baa": {
        id: "node-p4-baa",
        level: "P4",
        question: "P4-BAA 结果节点",
        options: [],
      },
    },
  };
}

// 默认 Summary 模板(测试渲染)
const SUMMARY_TEMPLATE = {
  subject: "Quiz 结果摘要",
  body: "感谢您完成问卷!\n关联主题:@主题\n选择路径:\n@选择路径",
};

/** 依次选择并点击"继续"到目标层级 */
function navigateTo(nextOptionTexts: string[]) {
  for (const text of nextOptionTexts) {
    fireEvent.click(screen.getByText(text));
    fireEvent.click(screen.getByRole("button", { name: "继续" }));
  }
}

describe("QuizFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初始渲染显示 P1 根节点问题与选项", () => {
    render(
      <QuizFlow
        template={buildTestTemplate()}
        summaryTemplate={SUMMARY_TEMPLATE}
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByText("P1 问题文本")).toBeInTheDocument();
    expect(screen.getByText("A. P1 选项 A")).toBeInTheDocument();
    expect(screen.getByText("B. P1 选项 B")).toBeInTheDocument();
  });

  it("未选中选项时'继续'按钮禁用", () => {
    render(
      <QuizFlow
        template={buildTestTemplate()}
        summaryTemplate={SUMMARY_TEMPLATE}
        onComplete={vi.fn()}
      />
    );

    const continueButton = screen.getByRole("button", { name: "继续" });
    expect(continueButton).toBeDisabled();
  });

  it("选中选项后点击'继续'跳转到 P2-A 节点", () => {
    render(
      <QuizFlow
        template={buildTestTemplate()}
        summaryTemplate={SUMMARY_TEMPLATE}
        onComplete={vi.fn()}
      />
    );

    navigateTo(["A. P1 选项 A"]);

    expect(screen.getByText("P2-A 问题文本")).toBeInTheDocument();
    expect(screen.queryByText("P1 问题文本")).not.toBeInTheDocument();
  });

  it("P2 选选项继续后进入 P3 节点", () => {
    render(
      <QuizFlow
        template={buildTestTemplate()}
        summaryTemplate={SUMMARY_TEMPLATE}
        onComplete={vi.fn()}
      />
    );

    navigateTo(["A. P1 选项 A", "A. P2-A 选项 A"]);

    expect(screen.getByText("P3-AA 问题文本")).toBeInTheDocument();
  });

  it("P3 选选项继续后进入 P4 结果层,展示 summary 摘要", () => {
    render(
      <QuizFlow
        template={buildTestTemplate()}
        summaryTemplate={SUMMARY_TEMPLATE}
        onComplete={vi.fn()}
      />
    );

    navigateTo(["A. P1 选项 A", "A. P2-A 选项 A", "A. P3-AA 选项 A"]);

    // summary 模板渲染:主题 + 选择路径
    expect(screen.getByText("Quiz 结果摘要")).toBeInTheDocument();
    expect(screen.getByText(/关联主题:数学/)).toBeInTheDocument();
    expect(screen.getByText(/\[P1\] P1 问题文本 → A:P1 选项 A/)).toBeInTheDocument();
  });

  it("P4 页点击'确定并返回开始'后调用 onComplete 回调", () => {
    const onCompleteMock = vi.fn();
    render(
      <QuizFlow
        template={buildTestTemplate()}
        summaryTemplate={SUMMARY_TEMPLATE}
        onComplete={onCompleteMock}
      />
    );

    navigateTo(["A. P1 选项 A", "A. P2-A 选项 A", "A. P3-AA 选项 A"]);
    fireEvent.click(screen.getByRole("button", { name: "确定并返回开始" }));

    expect(onCompleteMock).toHaveBeenCalledTimes(1);
    const result = onCompleteMock.mock.calls[0][0];
    expect(result.theme).toBe("数学");
    expect(result.managerId).toBe("manager-001");
    expect(result.path).toHaveLength(3); // P1 + P2 + P3
  });

  it("onComplete 回调的 path 包含完整的选择路径", () => {
    const onCompleteMock = vi.fn();
    render(
      <QuizFlow
        template={buildTestTemplate()}
        summaryTemplate={SUMMARY_TEMPLATE}
        onComplete={onCompleteMock}
      />
    );

    navigateTo(["A. P1 选项 A", "A. P2-A 选项 A", "A. P3-AA 选项 A"]);
    fireEvent.click(screen.getByRole("button", { name: "确定并返回开始" }));

    const result = onCompleteMock.mock.calls[0][0];
    expect(result.path[0].nodeLevel).toBe("P1");
    expect(result.path[0].optionLabel).toBe("A");
    expect(result.path[0].optionText).toBe("P1 选项 A");
    expect(result.path[1].nodeLevel).toBe("P2");
    expect(result.path[1].optionLabel).toBe("A");
    expect(result.path[2].nodeLevel).toBe("P3");
    expect(result.path[2].optionLabel).toBe("A");
  });

  it("支持选择不同路径(P1→B→P2-B→P3-BA→P4)", () => {
    const onCompleteMock = vi.fn();
    render(
      <QuizFlow
        template={buildTestTemplate()}
        summaryTemplate={SUMMARY_TEMPLATE}
        onComplete={onCompleteMock}
      />
    );

    navigateTo(["B. P1 选项 B", "A. P2-B 选项 A", "A. P3-BA 选项 A"]);
    fireEvent.click(screen.getByRole("button", { name: "确定并返回开始" }));

    expect(onCompleteMock).toHaveBeenCalledTimes(1);
    const result = onCompleteMock.mock.calls[0][0];
    expect(result.theme).toBe("绘画");
    expect(result.path[0].optionLabel).toBe("B"); // P1 选 B
    expect(result.path[1].optionLabel).toBe("A"); // P2-B 选 A
  });

  it("无 summary 模板时 P4 展示默认摘要", () => {
    render(
      <QuizFlow
        template={buildTestTemplate()}
        summaryTemplate={null}
        onComplete={vi.fn()}
      />
    );

    navigateTo(["A. P1 选项 A", "A. P2-A 选项 A", "A. P3-AA 选项 A"]);

    expect(screen.getByText("Quiz 结果摘要")).toBeInTheDocument();
    expect(screen.getByText(/感谢您完成 Quiz 问卷/)).toBeInTheDocument();
  });
});
