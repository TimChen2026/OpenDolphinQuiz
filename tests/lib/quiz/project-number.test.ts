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
import { generateProjectNumber, sanitizeCustomerName } from "@/lib/quiz/project-number";

describe("sanitizeCustomerName", () => {
  it("保留中文字符", () => {
    expect(sanitizeCustomerName("张三")).toBe("张三");
  });

  it("保留英文字符和数字", () => {
    expect(sanitizeCustomerName("John123")).toBe("John123");
  });

  it("将空格替换为下划线", () => {
    expect(sanitizeCustomerName("张 三")).toBe("张_三");
  });

  it("移除特殊字符(保留中文/英文/数字/下划线)", () => {
    expect(sanitizeCustomerName("张三@#$%")).toBe("张三");
  });

  it("移除连字符(避免与分隔符冲突)", () => {
    expect(sanitizeCustomerName("张-三")).toBe("张三");
  });

  it("空字符串返回'unknown'", () => {
    expect(sanitizeCustomerName("")).toBe("unknown");
  });

  it("仅特殊字符的字符串返回'unknown'", () => {
    expect(sanitizeCustomerName("@#$%")).toBe("unknown");
  });
});

describe("generateProjectNumber", () => {
  it("生成格式为 客户名-YYYY-MM-DD-HHmmss 的项目编号", () => {
    // 固定时间:2026-08-12 14:30:25 UTC
    const inquiryTime = new Date("2026-08-12T14:30:25Z");
    const projectNumber = generateProjectNumber("张三", inquiryTime);

    expect(projectNumber).toBe("张三-2026-08-12-143025");
  });

  it("使用 UTC 时间生成项目编号", () => {
    // 同一时刻不同时区传入,应生成相同的项目编号
    const utcTime = new Date("2026-08-12T14:30:25Z");
    const projectNumber1 = generateProjectNumber("John", utcTime);

    // 验证 UTC 时间格式
    expect(projectNumber1).toMatch(/^John-2026-08-12-143025$/);
  });

  it("客户名会被清洗(移除特殊字符)", () => {
    const inquiryTime = new Date("2026-08-12T14:30:25Z");
    const projectNumber = generateProjectNumber("张@三", inquiryTime);

    expect(projectNumber).toBe("张三-2026-08-12-143025");
  });

  it("单数字日期时间补零(如 8 月 → 08,9 点 → 09)", () => {
    // 2026-01-05 09:05:03 UTC
    const inquiryTime = new Date("2026-01-05T09:05:03Z");
    const projectNumber = generateProjectNumber("李四", inquiryTime);

    expect(projectNumber).toBe("李四-2026-01-05-090503");
  });

  it("时间部分精确到秒(6 位数字)", () => {
    const inquiryTime = new Date("2026-08-12T23:59:59Z");
    const projectNumber = generateProjectNumber("王五", inquiryTime);

    expect(projectNumber).toBe("王五-2026-08-12-235959");
  });

  it("不同客户名生成不同项目编号", () => {
    const inquiryTime = new Date("2026-08-12T14:30:25Z");
    const number1 = generateProjectNumber("张三", inquiryTime);
    const number2 = generateProjectNumber("李四", inquiryTime);

    expect(number1).not.toBe(number2);
  });

  it("同一客户不同时间生成不同项目编号", () => {
    const time1 = new Date("2026-08-12T14:30:25Z");
    const time2 = new Date("2026-08-12T14:30:26Z");

    const number1 = generateProjectNumber("张三", time1);
    const number2 = generateProjectNumber("张三", time2);

    expect(number1).not.toBe(number2);
  });
});
