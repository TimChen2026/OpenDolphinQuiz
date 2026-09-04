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

// GDPR 退订链接 Token(GDPR 合规退订机制 · 识别环节)
//
// 使用 jose(而非 jsonwebtoken)以兼容 Next.js Edge Runtime。
// 密钥从 JWT_SECRET 读取(要求不低于 32 位),Token 内含 email,
// 30 天过期——退订 URL 中不出现明文邮箱。
//
// 密钥采用惰性读取(而非模块顶层),避免缺少环境变量时 import 即崩溃,
// 并在运行时给出明确的配置错误提示。

import { SignJWT, jwtVerify } from "jose";

const UNSUBSCRIBE_TOKEN_EXPIRY = "30d";

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET is not configured or too short (must be at least 32 characters)"
    );
  }
  // 标准 jose 用法:TextEncoder 编码密钥(兼容 Edge Runtime)
  return new TextEncoder().encode(secret);
}

/**
 * 为指定邮箱生成退订 Token
 *
 * @param email 收件人邮箱(编码进 Token payload,不出现在 URL 明文中)
 */
export async function generateUnsubscribeToken(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(UNSUBSCRIBE_TOKEN_EXPIRY)
    .sign(getSecretKey());
}

/**
 * 校验退订 Token 并提取邮箱
 *
 * @returns Token 中的邮箱地址
 * @throws Token 无效、过期或 payload 缺少 email 时抛出异常
 */
export async function verifyUnsubscribeToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, getSecretKey());
  if (!payload.email || typeof payload.email !== "string") {
    throw new Error("Invalid token payload");
  }
  return payload.email;
}
