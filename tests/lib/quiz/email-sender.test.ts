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

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateConfirmUrl,
  prepareInquiryEmail,
  sendInquiryNotificationEmail,
} from "@/lib/quiz/email-sender";
import type { QuizResult } from "@/lib/quiz/transform";

// Mock Resend 客户端
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock crypto.randomUUID 保证测试可重复
function mockRandomUUID(value: string): () => void {
  const original = globalThis.crypto.randomUUID;
  // 使用类型断言绕过 TypeScript 对 randomUUID 返回类型的严格检查
  (globalThis.crypto as { randomUUID: () => string }).randomUUID = () => value;
  return () => {
    (globalThis.crypto as { randomUUID: () => string }).randomUUID = original;
  };
}

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

describe("generateConfirmUrl", () => {
  beforeEach(() => {
    // 清除环境变量
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("生成包含项目编号和 token 的确认 URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
    const restore = mockRandomUUID("test-uuid-001");
    const url = generateConfirmUrl("张三-2026-08-12-143025");
    restore();

    expect(url).toContain("https://example.com");
    expect(url).toContain("/quiz/confirm");
    // 项目编号在 URL 中会被编码,需解码后验证
    const decodedUrl = decodeURIComponent(url);
    expect(decodedUrl).toContain("project=张三-2026-08-12-143025");
    expect(url).toContain("token=test-uuid-001");
  });

  it("未配置 NEXT_PUBLIC_APP_URL 时使用 localhost 作为默认值", () => {
    const restore = mockRandomUUID("test-uuid-002");
    const url = generateConfirmUrl("test-project");
    restore();

    expect(url).toContain("http://localhost");
    expect(url).toContain("token=test-uuid-002");
  });
});

describe("prepareInquiryEmail", () => {
  const result = buildTestResult();
  const inquiryTime = new Date("2026-08-12T14:30:25Z");

  it("返回包含收件人、抄送和邮件内容的负载", () => {
    const restore = mockRandomUUID("test-uuid-003");
    const payload = prepareInquiryEmail({
      result,
      customerName: "张三",
      customerPhone: "13800138000",
      customerEmail: "zhangsan@example.com",
      projectName: "张三-2026-08-12-143025",
      inquiryTime,
      managerEmail: "manager@example.com",
      managerName: "李经理",
      directorEmail: "director@example.com",
    });
    restore();

    expect(payload.to).toBe("manager@example.com");
    expect(payload.cc).toEqual(["director@example.com"]);
    expect(payload.content.customerName).toBe("张三");
    expect(payload.content.projectName).toBe("张三-2026-08-12-143025");
    expect(payload.content.managerName).toBe("李经理");
    expect(payload.content.confirmUrl).toContain("token=test-uuid-003");
  });

  it("销售经理邮箱为 null 时,收件人为空数组", () => {
    const payload = prepareInquiryEmail({
      result,
      customerName: "张三",
      customerPhone: "13800138000",
      customerEmail: "zhangsan@example.com",
      projectName: "张三-2026-08-12-143025",
      inquiryTime,
      managerEmail: null,
      managerName: null,
      directorEmail: "director@example.com",
    });

    expect(payload.to).toBe("");
    expect(payload.cc).toEqual(["director@example.com"]);
  });

  it("销售总监邮箱为 null 时,抄送为空数组", () => {
    const payload = prepareInquiryEmail({
      result,
      customerName: "张三",
      customerPhone: "13800138000",
      customerEmail: "zhangsan@example.com",
      projectName: "张三-2026-08-12-143025",
      inquiryTime,
      managerEmail: "manager@example.com",
      managerName: "李经理",
      directorEmail: null,
    });

    expect(payload.to).toBe("manager@example.com");
    expect(payload.cc).toEqual([]);
  });
});

describe("sendInquiryNotificationEmail", () => {
  const result = buildTestResult();
  const inquiryTime = new Date("2026-08-12T14:30:25Z");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("调用 sendEmail 发送邮件给销售经理并抄送总监", async () => {
    const { sendEmail } = await import("@/lib/email");
    const sendResult = await sendInquiryNotificationEmail({
      result,
      customerName: "张三",
      customerPhone: "13800138000",
      customerEmail: "zhangsan@example.com",
      projectName: "张三-2026-08-12-143025",
      inquiryTime,
      managerEmail: "manager@example.com",
      managerName: "李经理",
      directorEmail: "director@example.com",
    });

    expect(sendResult.success).toBe(true);
    expect(sendEmail).toHaveBeenCalledTimes(1);

    const callArgs = (sendEmail as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(callArgs.to).toBe("manager@example.com");
    expect(callArgs.subject).toContain("张三-2026-08-12-143025");
    expect(callArgs.subject).toContain("数学");
  });

  it("销售经理邮箱为 null 时返回失败且不发送邮件", async () => {
    const { sendEmail } = await import("@/lib/email");
    const sendResult = await sendInquiryNotificationEmail({
      result,
      customerName: "张三",
      customerPhone: "13800138000",
      customerEmail: "zhangsan@example.com",
      projectName: "张三-2026-08-12-143025",
      inquiryTime,
      managerEmail: null,
      managerName: null,
      directorEmail: "director@example.com",
    });

    expect(sendResult.success).toBe(false);
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
