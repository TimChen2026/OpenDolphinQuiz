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
import { verifyTurnstileToken, isTurnstileEnabled } from "@/lib/turnstile";

describe("turnstile", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "test-site-key";
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("isTurnstileEnabled 在密钥配置时返回true", () => {
    expect(isTurnstileEnabled()).toBe(true);
  });

  it("isTurnstileEnabled 在密钥未配置时返回false", () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    expect(isTurnstileEnabled()).toBe(false);
  });

  it("verifyTurnstileToken 验证成功返回true", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    const result = await verifyTurnstileToken("valid-token");
    expect(result).toBe(true);
  });

  it("verifyTurnstileToken 验证失败返回false", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: false, "error-codes": ["invalid-input-response"] }),
    });
    const result = await verifyTurnstileToken("invalid-token");
    expect(result).toBe(false);
  });

  it("verifyTurnstileToken 空token返回false", async () => {
    const result = await verifyTurnstileToken("");
    expect(result).toBe(false);
  });
});
