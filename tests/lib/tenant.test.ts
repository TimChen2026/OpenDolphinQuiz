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
import { getCurrentTenantId, assertTenantOwnership, getCurrentTenantIdOrNull } from "@/lib/tenant";

vi.mock("@/lib/auth/session", () => ({
  getActiveSessionUser: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

describe("tenant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 团队模型下,团队成员的租户 ID = 其所属团队的 ID
  it("getCurrentTenantId 在已登录时返回团队ID", async () => {
    const { getActiveSessionUser } = await import("@/lib/auth/session");
    vi.mocked(getActiveSessionUser).mockResolvedValue({
      ok: true,
      user: { id: "user-123", email: "user@example.com", plan: "free", role: "user", banned: false, emailVerified: true, banExpires: null, isDirector: false, accountType: "member", teamId: "team-001" },
    });
    const tenantId = await getCurrentTenantId();
    expect(tenantId).toBe("team-001");
  });

  it("getCurrentTenantId 在未登录时抛出异常", async () => {
    const { getActiveSessionUser } = await import("@/lib/auth/session");
    vi.mocked(getActiveSessionUser).mockResolvedValue({
      ok: false,
      error: "Unauthorized",
      status: 401,
    });
    await expect(getCurrentTenantId()).rejects.toThrow("Unauthorized");
  });

  it("getCurrentTenantId 客户账号(无团队)时抛出异常", async () => {
    const { getActiveSessionUser } = await import("@/lib/auth/session");
    vi.mocked(getActiveSessionUser).mockResolvedValue({
      ok: true,
      user: { id: "user-789", email: "customer@example.com", plan: "free", role: "user", banned: false, emailVerified: true, banExpires: null, isDirector: false, accountType: "customer", teamId: null },
    });
    await expect(getCurrentTenantId()).rejects.toThrow("客户账号无团队租户权限");
  });

  it("assertTenantOwnership 归属正确时不抛异常", async () => {
    const { getActiveSessionUser } = await import("@/lib/auth/session");
    vi.mocked(getActiveSessionUser).mockResolvedValue({
      ok: true,
      user: { id: "user-123", email: "user@example.com", plan: "free", role: "user", banned: false, emailVerified: true, banExpires: null, isDirector: false, accountType: "member", teamId: "team-001" },
    });
    await expect(assertTenantOwnership("team-001")).resolves.toBeUndefined();
  });

  it("assertTenantOwnership 归属错误时抛出异常", async () => {
    const { getActiveSessionUser } = await import("@/lib/auth/session");
    vi.mocked(getActiveSessionUser).mockResolvedValue({
      ok: true,
      user: { id: "user-123", email: "user@example.com", plan: "free", role: "user", banned: false, emailVerified: true, banExpires: null, isDirector: false, accountType: "member", teamId: "team-001" },
    });
    await expect(assertTenantOwnership("other-team")).rejects.toThrow("无权访问");
  });

  it("getCurrentTenantIdOrNull 在已登录时返回团队ID", async () => {
    const { getActiveSessionUser } = await import("@/lib/auth/session");
    vi.mocked(getActiveSessionUser).mockResolvedValue({
      ok: true,
      user: { id: "user-456", email: "admin@example.com", plan: "free", role: "admin", banned: false, emailVerified: true, banExpires: null, isDirector: false, accountType: "member", teamId: "team-002" },
    });
    const tenantId = await getCurrentTenantIdOrNull();
    expect(tenantId).toBe("team-002");
  });

  it("getCurrentTenantIdOrNull 客户账号时返回null", async () => {
    const { getActiveSessionUser } = await import("@/lib/auth/session");
    vi.mocked(getActiveSessionUser).mockResolvedValue({
      ok: true,
      user: { id: "user-789", email: "customer@example.com", plan: "free", role: "user", banned: false, emailVerified: true, banExpires: null, isDirector: false, accountType: "customer", teamId: null },
    });
    const tenantId = await getCurrentTenantIdOrNull();
    expect(tenantId).toBeNull();
  });

  it("getCurrentTenantIdOrNull 在未登录时返回null", async () => {
    const { getActiveSessionUser } = await import("@/lib/auth/session");
    vi.mocked(getActiveSessionUser).mockResolvedValue({
      ok: false,
      error: "Unauthorized",
      status: 401,
    });
    const tenantId = await getCurrentTenantIdOrNull();
    expect(tenantId).toBeNull();
  });
});
