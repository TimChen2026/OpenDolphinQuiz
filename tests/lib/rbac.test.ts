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

import { describe, it, expect, vi, beforeEach } from "vitest";
import { hasRole, isAdmin, isSalesDirector, isSalesManager } from "@/lib/rbac";

vi.mock("@/lib/auth/session", () => ({
  getActiveSessionUser: vi.fn(),
}));

describe("rbac", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = (role: string) => ({
    id: "user-1",
    role,
    banned: false,
    emailVerified: true,
    banExpires: null,
    isDirector: false,
  });

  it("hasRole 角色匹配时返回true", () => {
    expect(hasRole(mockUser("admin"), "admin")).toBe(true);
  });

  it("hasRole 角色不匹配时返回false", () => {
    expect(hasRole(mockUser("user"), "admin")).toBe(false);
  });

  it("isAdmin admin角色返回true", () => {
    expect(isAdmin(mockUser("admin"))).toBe(true);
  });

  it("isAdmin 非admin角色返回false", () => {
    expect(isAdmin(mockUser("sales_director"))).toBe(false);
  });

  it("isSalesDirector sales_director角色返回true", () => {
    expect(isSalesDirector(mockUser("sales_director"))).toBe(true);
  });

  it("isSalesManager sales_manager角色返回true", () => {
    expect(isSalesManager(mockUser("sales_manager"))).toBe(true);
  });
});
