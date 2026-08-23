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
import {
  hasRole,
  isAdmin,
  isSuperAdminEmail,
  isSalesDirector,
  isSalesManager,
} from "@/lib/rbac";

vi.mock("@/lib/auth/session", () => ({
  getActiveSessionUser: vi.fn(),
}));

describe("rbac", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SUPER_ADMIN_EMAIL;
  });

  afterEach(() => {
    delete process.env.SUPER_ADMIN_EMAIL;
  });

  const mockUser = (role: string, email = "normal-user@example.com") => ({
    id: "user-1",
    email,
    plan: "free",
    role,
    banned: false,
    emailVerified: true,
    banExpires: null,
    isDirector: false,
    accountType: "member",
    teamId: "user-1",
  });

  it("hasRole 角色匹配时返回true", () => {
    expect(hasRole(mockUser("admin"), "admin")).toBe(true);
  });

  it("hasRole 角色不匹配时返回false", () => {
    expect(hasRole(mockUser("user"), "admin")).toBe(false);
  });

  it("isAdmin admin角色但非超级管理员邮箱返回false(管理后台仅超管可访问)", () => {
    process.env.SUPER_ADMIN_EMAIL = "super@example.com";
    expect(isAdmin(mockUser("admin", "team-admin@example.com"))).toBe(false);
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

describe("isSuperAdminEmail 超级管理员识别", () => {
  const SUPER_ADMIN = "huiting.chen@outlook.com";

  beforeEach(() => {
    process.env.SUPER_ADMIN_EMAIL = SUPER_ADMIN;
  });

  afterEach(() => {
    delete process.env.SUPER_ADMIN_EMAIL;
  });

  it("邮箱与环境变量一致时返回true", () => {
    expect(isSuperAdminEmail(SUPER_ADMIN)).toBe(true);
  });

  it("邮箱大小写不一致时仍返回true(大小写不敏感)", () => {
    expect(isSuperAdminEmail("Huiting.Chen@Outlook.com")).toBe(true);
  });

  it("邮箱前后带空格时仍返回true", () => {
    expect(isSuperAdminEmail(`  ${SUPER_ADMIN}  `)).toBe(true);
  });

  it("其他邮箱返回false", () => {
    expect(isSuperAdminEmail("someone-else@example.com")).toBe(false);
  });

  it("未配置环境变量时一律返回false", () => {
    delete process.env.SUPER_ADMIN_EMAIL;
    expect(isSuperAdminEmail(SUPER_ADMIN)).toBe(false);
  });

  it("空邮箱返回false", () => {
    expect(isSuperAdminEmail("")).toBe(false);
    expect(isSuperAdminEmail(null)).toBe(false);
    expect(isSuperAdminEmail(undefined)).toBe(false);
  });

  it("isAdmin 对超级管理员邮箱返回true(即使角色为普通 user)", () => {
    const superAdminUser = {
      id: "user-1",
      email: SUPER_ADMIN,
      plan: "free",
      role: "user",
      banned: false,
      emailVerified: true,
      banExpires: null,
      isDirector: false,
      accountType: "member",
      teamId: "team-1",
    };
    expect(isAdmin(superAdminUser)).toBe(true);
  });

  it("isAdmin 对未配置的邮箱即使同名也不放行", () => {
    delete process.env.SUPER_ADMIN_EMAIL;
    const fakeSuperAdmin = {
      id: "user-1",
      email: SUPER_ADMIN,
      plan: "free",
      role: "user",
      banned: false,
      emailVerified: true,
      banExpires: null,
      isDirector: false,
      accountType: "member",
      teamId: "team-1",
    };
    expect(isAdmin(fakeSuperAdmin)).toBe(false);
  });
});
