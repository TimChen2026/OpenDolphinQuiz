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
import { user, USER_ROLES, PASSPORT_STATUS } from "@/lib/db/schema";

describe("user schema", () => {
  it("user 表包含 phone 字段", () => {
    expect(user.phone).toBeDefined();
  });

  it("user 表包含 role 字段", () => {
    expect(user.role).toBeDefined();
  });

  it("user 表包含 passportStatus 字段", () => {
    expect(user.passportStatus).toBeDefined();
  });

  it("user 表包含 passportVerifiedAt 字段", () => {
    expect(user.passportVerifiedAt).toBeDefined();
  });

  it("user 表包含 passportExpiresAt 字段", () => {
    expect(user.passportExpiresAt).toBeDefined();
  });

  it("user 表包含 timezone 字段", () => {
    expect(user.timezone).toBeDefined();
  });

  it("USER_ROLES 包含四种角色", () => {
    expect(USER_ROLES.ADMIN).toBe("admin");
    expect(USER_ROLES.SALES_DIRECTOR).toBe("sales_director");
    expect(USER_ROLES.SALES_MANAGER).toBe("sales_manager");
    expect(USER_ROLES.USER).toBe("user");
  });

  it("PASSPORT_STATUS 包含三种状态", () => {
    expect(PASSPORT_STATUS.UNVERIFIED).toBe("unverified");
    expect(PASSPORT_STATUS.VERIFIED).toBe("verified");
    expect(PASSPORT_STATUS.EXPIRED).toBe("expired");
  });
});
