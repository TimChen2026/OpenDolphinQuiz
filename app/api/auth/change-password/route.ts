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

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { account } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// 密码强度校验规则（参考 Better Auth 安全建议）
const passwordSchema = z
  .string()
  .min(8, "密码长度至少需要 8 个字符")
  .max(128, "密码长度不能超过 128 个字符")
  .refine((password) => {
    // 至少包含一个大写字母
    return /[A-Z]/.test(password);
  }, "密码需要至少包含一个大写字母")
  .refine((password) => {
    // 至少包含一个小写字母
    return /[a-z]/.test(password);
  }, "密码需要至少包含一个小写字母")
  .refine((password) => {
    // 至少包含一个数字
    return /[0-9]/.test(password);
  }, "密码需要至少包含一个数字")
  .refine((password) => {
    // 至少包含一个特殊字符
    return /[!@#$%^&*(),.?":{}|<>_\-+\[\]\\;\/~`]/.test(password);
  }, "密码需要至少包含一个特殊字符")
  .refine((password) => {
    // 不允许连续3个相同字符
    return !/(.)\1{2,}/.test(password);
  }, "密码不能包含连续 3 个相同字符");

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "请输入当前密码"),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, "请确认新密码"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "新密码不能与当前密码相同",
  path: ["newPassword"],
});

export async function PUT(request: NextRequest) {
  try {
    // 验证用户身份
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session?.userId) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const userId = session.session.userId;
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
    }

    // 参数校验
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message || "密码校验失败" },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    // 获取用户的 credential 账户
    const credentialAccounts = await db
      .select({
        id: account.id,
        password: account.password,
      })
      .from(account)
      .where(
        and(
          eq(account.userId, userId),
          eq(account.providerId, "credential")
        )
      );

    if (credentialAccounts.length === 0) {
      return NextResponse.json(
        { error: "当前账户不支持修改密码（可能使用第三方登录）" },
        { status: 400 }
      );
    }

    const credentialAccount = credentialAccounts[0];

    // 验证当前密码
    if (!credentialAccount.password) {
      return NextResponse.json(
        { error: "当前账户未设置密码，请使用忘记密码功能" },
        { status: 400 }
      );
    }

    const isValidCurrentPassword = await verifyPassword({
      hash: credentialAccount.password,
      password: currentPassword,
    });

    if (!isValidCurrentPassword) {
      return NextResponse.json(
        { error: "当前密码不正确" },
        { status: 400 }
      );
    }

    // 生成新密码哈希
    const hashedPassword = await hashPassword(newPassword);

    // 更新密码
    const updatedAccounts = await db
      .update(account)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(account.userId, userId),
          eq(account.providerId, "credential")
        )
      )
      .returning({ id: account.id });

    if (updatedAccounts.length === 0) {
      return NextResponse.json(
        { error: "密码更新失败，请稍后重试" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "密码修改成功" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "密码修改失败，请稍后重试" },
      { status: 500 }
    );
  }
}