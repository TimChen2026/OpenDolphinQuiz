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

// @vitest-environment node
// 本文件用 node 环境:jsdom realm 下 jose 的 HS256 密钥 instanceof 校验会跨 realm 失败

// GDPR 退订机制单元测试:JWT Token 往返 + 退订列表过滤 + 链接生成

import { describe, expect, it, vi, beforeEach } from "vitest";

process.env.JWT_SECRET = "test-secret-key-for-vitest-0123456789abcdef";

import {
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
} from "@/lib/jwt";

const mockUnsubscribeRows: { email: string }[] = [];

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn().mockResolvedValue(mockUnsubscribeRows),
    })),
  },
}));

import { excludeUnsubscribed } from "@/lib/email-unsubscribe";

describe("unsubscribe JWT token", () => {
  it("生成 Token 后可校验还原出同一邮箱", async () => {
    const email = "guest@example.com";
    const token = await generateUnsubscribeToken(email);

    expect(typeof token).toBe("string");
    expect(token).not.toContain(email); // 明文邮箱不得出现在 Token 外

    const decoded = await verifyUnsubscribeToken(token);
    expect(decoded).toBe(email);
  });

  it("篡改的 Token 校验失败", async () => {
    const token = await generateUnsubscribeToken("guest@example.com");
    const tampered = token.slice(0, -3) + "abc";

    await expect(verifyUnsubscribeToken(tampered)).rejects.toThrow();
  });
});

describe("excludeUnsubscribed", () => {
  beforeEach(() => {
    mockUnsubscribeRows.length = 0;
  });

  it("剔除已退订邮箱,保留未退订邮箱且顺序不变", async () => {
    mockUnsubscribeRows.push({ email: "b@example.com" });

    const result = await excludeUnsubscribed([
      "a@example.com",
      "b@example.com",
      "c@example.com",
    ]);

    expect(result).toEqual(["a@example.com", "c@example.com"]);
  });

  it("空收件人列表直接返回空数组(不查询数据库)", async () => {
    const result = await excludeUnsubscribed([]);
    expect(result).toEqual([]);
  });
});
