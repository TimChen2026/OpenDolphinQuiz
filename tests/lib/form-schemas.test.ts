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

import { contactSchema } from "@/features/marketing/schemas";
import { loginSchema, signupSchema } from "@/features/auth/schemas";

describe("form schemas", () => {
  it("prefers the required email error when auth email fields are blank", () => {
    const loginResult = loginSchema.safeParse({
      email: "   ",
      password: "secret",
    });
    const signupResult = signupSchema.safeParse({
      name: "Alice",
      email: "   ",
      password: "secret",
    });

    expect(loginResult.success).toBe(false);
    expect(signupResult.success).toBe(false);
    expect(loginResult.error?.issues[0]?.message).toBe("Please enter email");
    expect(signupResult.error?.issues[0]?.message).toBe("Please enter email");
  });

  it("trims marketing form values before validation", () => {
    const result = contactSchema.safeParse({
      name: "  DolphinQuiz  ",
      email: "  team@example.com  ",
      company: "  Example Inc  ",
      message: "  Hello there  ",
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      name: "DolphinQuiz",
      email: "team@example.com",
      company: "Example Inc",
      message: "Hello there",
    });
  });
});
