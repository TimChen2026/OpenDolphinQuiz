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

// Quiz 询盘提交编排单元测试
//
// 覆盖:
// - buildProjectInsertData:插入数据构建
// - isUniqueViolation:唯一冲突识别
// - resolveRecipients:收件人解析(经理/总监/测试回退)
// - insertProjectWithRetry:唯一冲突重试
// - submitQuizInquiry:完整提交编排(入库 + 发邮件)

import { describe, it, expect, vi } from "vitest";
import {
  buildProjectInsertData,
  isUniqueViolation,
  resolveRecipients,
  insertProjectWithRetry,
  submitQuizInquiry,
  MAX_PROJECT_NUMBER_RETRIES,
  type SubmitQuizParams,
  type QuizCustomer,
} from "@/lib/quiz/submit";
import type { QuizResult } from "@/lib/quiz/transform";

// ==================== 测试数据 ====================

const CUSTOMER: QuizCustomer = {
  id: "user-001",
  name: "张三",
  phone: "13800138000",
  email: "zhangsan@example.com",
};

const RESULT: QuizResult = {
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

function buildParams(
  overrides: Partial<SubmitQuizParams> = {}
): SubmitQuizParams {
  return {
    templateId: "tpl-001",
    tenantId: "user-001",
    customer: CUSTOMER,
    result: RESULT,
    manager: { name: "李经理", email: "manager@example.com" },
    director: { name: "王总监", email: "director@example.com" },
    fallbackEmail: null,
    inquiryTime: new Date("2026-08-12T14:30:25Z"),
    ...overrides,
  };
}

// ==================== buildProjectInsertData ====================

describe("buildProjectInsertData", () => {
  it("包含项目编号、客户信息、询盘时间(UTC 拆分)与主题", () => {
    const data = buildProjectInsertData(
      buildParams(),
      new Date("2026-08-12T14:30:25Z"),
      "张三-2026-08-12-143025"
    );

    expect(data.projectNumber).toBe("张三-2026-08-12-143025");
    expect(data.customerName).toBe("张三");
    expect(data.tenantId).toBe("user-001");
    expect(data.userId).toBe("user-001");
    expect(data.theme).toBe("数学");
    expect(data.managerId).toBe("manager-001");
    expect(data.phone).toBe("13800138000");
    expect(data.email).toBe("zhangsan@example.com");
    // UTC 拆分:2026-08-12T14:30:25Z → 日期 2026-08-12,时间 14:30:25
    expect(data.inquiryDate).toBe("2026-08-12");
    expect(data.inquiryTime).toBe("14:30:25");
    expect(data.inquiryDatetime.toISOString()).toBe("2026-08-12T14:30:25.000Z");
  });
});

// ==================== isUniqueViolation ====================

describe("isUniqueViolation", () => {
  it("错误码 23505 时返回 true", () => {
    expect(isUniqueViolation({ code: "23505", message: "duplicate key" })).toBe(
      true
    );
  });

  it("其他错误码返回 false", () => {
    expect(isUniqueViolation({ code: "23503", message: "fk violation" })).toBe(
      false
    );
  });

  it("非对象或 null 返回 false", () => {
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation("error")).toBe(false);
  });
});

// ==================== resolveRecipients ====================

describe("resolveRecipients", () => {
  it("经理与总监存在时直接使用", () => {
    const recipients = resolveRecipients(buildParams());
    expect(recipients.managerEmail).toBe("manager@example.com");
    expect(recipients.managerName).toBe("李经理");
    expect(recipients.directorEmail).toBe("director@example.com");
  });

  it("经理缺失且配置回退邮箱时,发往回退邮箱", () => {
    const recipients = resolveRecipients(
      buildParams({ manager: null, fallbackEmail: "test@example.com" })
    );
    expect(recipients.managerEmail).toBe("test@example.com");
    expect(recipients.managerName).toBe("内部测试");
  });

  it("经理缺失且无回退邮箱时,收件人为空", () => {
    const recipients = resolveRecipients(
      buildParams({ manager: null, fallbackEmail: null })
    );
    expect(recipients.managerEmail).toBeNull();
    expect(recipients.managerName).toBeNull();
  });

  it("总监缺失时抄送为空", () => {
    const recipients = resolveRecipients(buildParams({ director: null }));
    expect(recipients.directorEmail).toBeNull();
  });
});

// ==================== insertProjectWithRetry ====================

describe("insertProjectWithRetry", () => {
  it("首次插入成功时直接返回基础编号", async () => {
    const insertFn = vi.fn().mockResolvedValue(undefined);
    const projectNumber = await insertProjectWithRetry(
      insertFn,
      buildParams(),
      new Date("2026-08-12T14:30:25Z")
    );

    expect(projectNumber).toBe("张三-2026-08-12-143025");
    expect(insertFn).toHaveBeenCalledTimes(1);
  });

  it("唯一冲突时追加序号重试(-1, -2)", async () => {
    const insertFn = vi
      .fn()
      .mockRejectedValueOnce({ code: "23505" }) // 第一次冲突
      .mockRejectedValueOnce({ code: "23505" }) // 第二次冲突
      .mockResolvedValue(undefined); // 第三次成功

    const projectNumber = await insertProjectWithRetry(
      insertFn,
      buildParams(),
      new Date("2026-08-12T14:30:25Z")
    );

    expect(projectNumber).toBe("张三-2026-08-12-143025-2");
    expect(insertFn).toHaveBeenCalledTimes(3);
    const thirdCallData = insertFn.mock.calls[2][0];
    expect(thirdCallData.projectNumber).toBe("张三-2026-08-12-143025-2");
  });

  it("持续冲突超过上限时抛出异常", async () => {
    const insertFn = vi.fn().mockRejectedValue({ code: "23505" });

    await expect(
      insertProjectWithRetry(
        insertFn,
        buildParams(),
        new Date("2026-08-12T14:30:25Z")
      )
    ).rejects.toThrow();

    expect(insertFn).toHaveBeenCalledTimes(MAX_PROJECT_NUMBER_RETRIES + 1);
  });

  it("非唯一冲突错误直接抛出,不重试", async () => {
    const insertFn = vi.fn().mockRejectedValue({ code: "23503" });

    await expect(
      insertProjectWithRetry(
        insertFn,
        buildParams(),
        new Date("2026-08-12T14:30:25Z")
      )
    ).rejects.toEqual({ code: "23503" });

    expect(insertFn).toHaveBeenCalledTimes(1);
  });
});

// ==================== submitQuizInquiry ====================

describe("submitQuizInquiry", () => {
  it("完整流程:生成编号 + 入库 + 发送邮件(含抄送)", async () => {
    const sendEmail = vi.fn().mockResolvedValue({ success: true });
    const outcome = await submitQuizInquiry(buildParams(), {
      insertProject: vi.fn().mockResolvedValue(undefined),
      sendEmail,
    });

    expect(outcome.projectNumber).toBe("张三-2026-08-12-143025");
    expect(outcome.emailSent).toBe(true);
    expect(outcome.emailError).toBeNull();

    const emailArgs = sendEmail.mock.calls[0][0];
    expect(emailArgs.managerEmail).toBe("manager@example.com");
    expect(emailArgs.managerName).toBe("李经理");
    expect(emailArgs.directorEmail).toBe("director@example.com");
    expect(emailArgs.customerName).toBe("张三");
    expect(emailArgs.customerPhone).toBe("13800138000");
    expect(emailArgs.projectName).toBe("张三-2026-08-12-143025");
  });

  it("经理缺失时回退到测试邮箱发送", async () => {
    const sendEmail = vi.fn().mockResolvedValue({ success: true });
    const outcome = await submitQuizInquiry(
      buildParams({ manager: null, fallbackEmail: "test@example.com" }),
      {
        insertProject: vi.fn().mockResolvedValue(undefined),
        sendEmail,
      }
    );

    expect(outcome.emailSent).toBe(true);
    const emailArgs = sendEmail.mock.calls[0][0];
    expect(emailArgs.managerEmail).toBe("test@example.com");
    expect(emailArgs.managerName).toBe("内部测试");
  });

  it("邮件发送失败时返回 emailSent=false 与错误信息", async () => {
    const sendEmail = vi
      .fn()
      .mockResolvedValue({ success: false, error: "Resend API 超时" });
    const outcome = await submitQuizInquiry(buildParams(), {
      insertProject: vi.fn().mockResolvedValue(undefined),
      sendEmail,
    });

    expect(outcome.emailSent).toBe(false);
    expect(outcome.emailError).toBe("Resend API 超时");
    // 项目编号仍应生成
    expect(outcome.projectNumber).toContain("张三");
  });

  it("入库失败时直接抛出,不发送邮件", async () => {
    const sendEmail = vi.fn().mockResolvedValue({ success: true });
    await expect(
      submitQuizInquiry(buildParams(), {
        insertProject: vi.fn().mockRejectedValue({ code: "23503" }),
        sendEmail,
      })
    ).rejects.toEqual({ code: "23503" });

    expect(sendEmail).not.toHaveBeenCalled();
  });
});
