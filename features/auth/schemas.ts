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

import { z } from "zod";
import { PHONE_PATTERN } from "@/lib/phone";

const email = z
  .string({ error: "Please enter email" })
  .trim()
  .min(1, "Please enter email")
  .email("Please enter valid email");

const password = z
  .string({ error: "Please enter password" })
  .min(1, "Please enter password");

export const loginSchema = z.object({
  email,
  password,
});

export const signupSchema = z.object({
  name: z
    .string({ error: "Please enter your name" })
    .trim()
    .min(1, "Please enter your name"),
  email,
  password,
  // 手机号:必填,11位数字(中国大陆手机号格式)
  phone: z
    .string({ error: "Please enter phone" })
    .trim()
    .regex(PHONE_PATTERN, "Please enter valid phone"),
  // Turnstile token:必填(人机验证)
  turnstileToken: z
    .string({ error: "Please complete turnstile" })
    .min(1, "Please complete turnstile"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
