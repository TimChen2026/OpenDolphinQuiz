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

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encrypt, decrypt, isEncryptionEnabled } from "@/lib/crypto";

describe("crypto", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.ENCRYPTION_KEY = "test-encryption-key-32-bytes-long!!";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("isEncryptionEnabled 在密钥配置时返回true", () => {
    expect(isEncryptionEnabled()).toBe(true);
  });

  it("isEncryptionEnabled 在密钥未配置时返回false", () => {
    delete process.env.ENCRYPTION_KEY;
    expect(isEncryptionEnabled()).toBe(false);
  });

  it("encrypt 加密后不等于明文", () => {
    const plaintext = "13800138000";
    const encrypted = encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
  });

  it("decrypt 能解密回原文", () => {
    const plaintext = "13800138000";
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("encrypt 每次产生不同密文(随机IV)", () => {
    const plaintext = "13800138000";
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);
    expect(encrypted1).not.toBe(encrypted2);
    expect(decrypt(encrypted1)).toBe(plaintext);
    expect(decrypt(encrypted2)).toBe(plaintext);
  });

  it("decrypt 错误密钥时抛出异常", () => {
    const encrypted = encrypt("test");
    process.env.ENCRYPTION_KEY = "different-key-32-bytes-long!!!!!!";
    expect(() => decrypt(encrypted)).toThrow();
  });
});
