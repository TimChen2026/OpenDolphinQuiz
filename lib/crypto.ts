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

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

// 从环境变量读取加密密钥,并通过 SHA-256 派生固定长度(32字节)密钥
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY 环境变量未配置");
  }
  // 使用 SHA-256 派生固定长度密钥
  return crypto.createHash("sha256").update(key).digest();
}

// 检查加密密钥是否已配置,用于上层判断是否启用加密能力
export function isEncryptionEnabled(): boolean {
  return Boolean(process.env.ENCRYPTION_KEY);
}

// 加密明文,返回 iv:authTag:encrypted (base64) 格式的字符串
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  // 格式: iv:authTag:encrypted (base64)
  return [iv, authTag, encrypted]
    .map((b) => b.toString("base64"))
    .join(":");
}

// 解密 iv:authTag:encrypted (base64) 格式的字符串,返回明文
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const [ivB64, authTagB64, encryptedB64] = ciphertext.split(":");
  if (!ivB64 || !authTagB64 || !encryptedB64) {
    throw new Error("密文格式错误");
  }
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
