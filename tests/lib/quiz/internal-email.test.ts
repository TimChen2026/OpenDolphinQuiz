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
  buildInquiryEmailContent,
  buildEmailSubject,
  formatPathSummary,
  renderTemplateVars,
  renderInternalEmailFromTemplate,
} from "@/lib/quiz/internal-email";
import type { QuizResult } from "@/lib/quiz/transform";

function buildTestResult(): QuizResult {
  return {
    theme: "数学",
    managerId: "manager-001",
    path: [
      {
        nodeId: "node-p1",
        nodeLevel: "P1",
        nodeQuestion: "您孩子的年龄段是?",
        optionId: "edge-p1-a",
        optionLabel: "A",
        optionText: "6-9 岁",
      },
      {
        nodeId: "node-p2-a",
        nodeLevel: "P2",
        nodeQuestion: "您希望试听的科目是?",
        optionId: "edge-p2-a-a",
        optionLabel: "A",
        optionText: "数学",
      },
      {
        nodeId: "node-p3-aa",
        nodeLevel: "P3",
        nodeQuestion: "您偏好的上课时间是?",
        optionId: "edge-p3-aa-a",
        optionLabel: "A",
        optionText: "周末上午",
      },
    ],
  };
}

describe("buildEmailSubject", () => {
  it("生成包含项目编号和主题的邮件主题", () => {
    const subject = buildEmailSubject({
      projectName: "张三-2026-08-12-143025",
      theme: "数学",
    });

    expect(subject).toContain("张三-2026-08-12-143025");
    expect(subject).toContain("数学");
  });

  it("主题为 null 时邮件主题仍包含项目编号", () => {
    const subject = buildEmailSubject({
      projectName: "张三-2026-08-12-143025",
      theme: null,
    });

    expect(subject).toContain("张三-2026-08-12-143025");
  });
});

describe("formatPathSummary", () => {
  it("将 Quiz 路径格式化为可读的文本摘要", () => {
    const result = buildTestResult();
    const summary = formatPathSummary(result.path);

    expect(summary).toContain("P1");
    expect(summary).toContain("您孩子的年龄段是?");
    expect(summary).toContain("6-9 岁");
    expect(summary).toContain("P2");
    expect(summary).toContain("数学");
    expect(summary).toContain("P3");
    expect(summary).toContain("周末上午");
  });

  it("每个路径条目独占一行", () => {
    const result = buildTestResult();
    const summary = formatPathSummary(result.path);

    // 至少 3 行(P1/P2/P3)
    const lines = summary.split("\n").filter((line) => line.trim().length > 0);
    expect(lines.length).toBeGreaterThanOrEqual(3);
  });
});

describe("buildInquiryEmailContent", () => {
  const result = buildTestResult();
  const inquiryTime = new Date("2026-08-12T14:30:25Z");

  const content = buildInquiryEmailContent({
    result,
    customerName: "张三",
    customerPhone: "13800138000",
    customerEmail: "zhangsan@example.com",
    projectName: "张三-2026-08-12-143025",
    inquiryTime,
    managerName: "李经理",
    managerEmail: "manager@example.com",
    confirmUrl: "https://example.com/confirm?token=abc123",
  });

  it("包含客户姓名", () => {
    expect(content.customerName).toBe("张三");
  });

  it("包含客户电话", () => {
    expect(content.customerPhone).toBe("13800138000");
  });

  it("包含客户邮箱", () => {
    expect(content.customerEmail).toBe("zhangsan@example.com");
  });

  it("包含项目编号", () => {
    expect(content.projectName).toBe("张三-2026-08-12-143025");
  });

  it("包含询盘时间(UTC ISO 字符串)", () => {
    expect(content.inquiryTimeIso).toBe("2026-08-12T14:30:25.000Z");
  });

  it("包含主题", () => {
    expect(content.theme).toBe("数学");
  });

  it("包含销售经理姓名", () => {
    expect(content.managerName).toBe("李经理");
  });

  it("包含销售经理邮箱", () => {
    expect(content.managerEmail).toBe("manager@example.com");
  });

  it("包含确认链接", () => {
    expect(content.confirmUrl).toBe("https://example.com/confirm?token=abc123");
  });

  it("包含格式化的路径摘要", () => {
    expect(content.pathSummary).toContain("P1");
    expect(content.pathSummary).toContain("您孩子的年龄段是?");
  });

  it("包含邮件主题", () => {
    expect(content.subject).toContain("张三-2026-08-12-143025");
    expect(content.subject).toContain("数学");
  });

  it("当主题为 null 时仍能正常生成", () => {
    const contentWithNullTheme = buildInquiryEmailContent({
      result: { ...result, theme: null },
      customerName: "张三",
      customerPhone: "13800138000",
      customerEmail: "zhangsan@example.com",
      projectName: "张三-2026-08-12-143025",
      inquiryTime,
      managerName: null,
      managerEmail: null,
      confirmUrl: null,
    });

    expect(contentWithNullTheme.theme).toBeNull();
    expect(contentWithNullTheme.managerName).toBeNull();
    expect(contentWithNullTheme.confirmUrl).toBeNull();
  });
});

describe("renderTemplateVars(验收修订 2.1.7.4-b:变量自动替换)", () => {
  const baseVars = {
    projectName: "张三-2026-08-12-143025",
    customerName: "张三",
    theme: "数学" as string | null,
    customerPhone: "13800138000",
    customerEmail: "zhangsan@example.com",
    inquiryTimeIso: "2026-08-12T14:30:25.000Z",
    managerName: "李经理" as string | null,
    pathSummary: "[P1] 年龄段? → A:6-9 岁",
  };

  it("替换全部 11 个可用变量", () => {
    const text =
      "@项目编号 @客户名 @主题 @客户电话 @客户邮箱 @询盘时间 @持续时间 @销售经理 @选择路径 @今日询盘次数 @定价页链接";
    const rendered = renderTemplateVars(text, {
      ...baseVars,
      durationHours: 26,
      inquiryCount: 3,
      pricingUrl: "https://example.com/pricing",
    });

    expect(rendered).toContain("张三-2026-08-12-143025");
    expect(rendered).toContain("张三");
    expect(rendered).toContain("数学");
    expect(rendered).toContain("13800138000");
    expect(rendered).toContain("zhangsan@example.com");
    expect(rendered).toContain("2026-08-12T14:30:25.000Z");
    expect(rendered).toContain("26");
    expect(rendered).toContain("李经理");
    expect(rendered).toContain("[P1] 年龄段? → A:6-9 岁");
    expect(rendered).toContain("3");
    expect(rendered).toContain("https://example.com/pricing");
    // 不应残留任何 @中文变量 占位符(邮箱中的 @ 除外)
    expect(rendered).not.toMatch(/@[\u4e00-\u9fa5]+/);
  });

  it("未提供的可选变量替换为空(不残留占位符)", () => {
    const rendered = renderTemplateVars("@持续时间@今日询盘次数", baseVars);
    expect(rendered).not.toContain("@持续时间");
    expect(rendered).not.toContain("@今日询盘次数");
  });
});

describe("renderInternalEmailFromTemplate", () => {
  it("按模板渲染 HTML 邮件并追加确认按钮", () => {
    const { subject, html } = renderInternalEmailFromTemplate(
      "[新询盘] @项目编号 - @主题",
      "尊敬的@销售经理,\n客户@客户名已提交询盘。",
      {
        projectName: "张三-2026-08-12-143025",
        customerName: "张三",
        theme: "数学",
        customerPhone: "13800138000",
        customerEmail: "zhangsan@example.com",
        inquiryTimeIso: "2026-08-12T14:30:25.000Z",
        managerName: "李经理",
        pathSummary: "[P1] 年龄段? → A:6-9 岁",
      },
      "https://example.com/confirm?token=abc"
    );

    expect(subject).toBe("[新询盘] 张三-2026-08-12-143025 - 数学");
    expect(html).toContain("尊敬的李经理");
    expect(html).toContain("张三");
    expect(html).toContain("确认收到询盘");
    expect(html).toContain("https://example.com/confirm?token=abc");
    expect(html).not.toContain("@客户名");
  });

  it("无确认链接时不渲染确认按钮", () => {
    const { html } = renderInternalEmailFromTemplate(
      "主题",
      "正文",
      {
        projectName: "编号",
        customerName: "客户",
        theme: null,
        customerPhone: "",
        customerEmail: "a@b.com",
        inquiryTimeIso: "2026-08-12T00:00:00.000Z",
        managerName: null,
        pathSummary: "",
      },
      null
    );
    expect(html).not.toContain("确认收到询盘");
  });
});
