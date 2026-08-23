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

  it("getCurrentTenantId 在已登录时返回用户ID", async () => {
    const { getActiveSessionUser } = await import("@/lib/auth/session");
    vi.mocked(getActiveSessionUser).mockResolvedValue({
      ok: true,
      user: { id: "user-123", email: "user@example.com", plan: "free", role: "user", banned: false, emailVerified: true, banExpires: null, isDirector: false },
    });
    const tenantId = await getCurrentTenantId();
    expect(tenantId).toBe("user-123");
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

  it("assertTenantOwnership 归属正确时不抛异常", async () => {
    const { getActiveSessionUser } = await import("@/lib/auth/session");
    vi.mocked(getActiveSessionUser).mockResolvedValue({
      ok: true,
      user: { id: "user-123", email: "user@example.com", plan: "free", role: "user", banned: false, emailVerified: true, banExpires: null, isDirector: false },
    });
    await expect(assertTenantOwnership("user-123")).resolves.toBeUndefined();
  });

  it("assertTenantOwnership 归属错误时抛出异常", async () => {
    const { getActiveSessionUser } = await import("@/lib/auth/session");
    vi.mocked(getActiveSessionUser).mockResolvedValue({
      ok: true,
      user: { id: "user-123", email: "user@example.com", plan: "free", role: "user", banned: false, emailVerified: true, banExpires: null, isDirector: false },
    });
    await expect(assertTenantOwnership("other-user")).rejects.toThrow("无权访问");
  });

  it("getCurrentTenantIdOrNull 在已登录时返回用户ID", async () => {
    const { getActiveSessionUser } = await import("@/lib/auth/session");
    vi.mocked(getActiveSessionUser).mockResolvedValue({
      ok: true,
      user: { id: "user-456", email: "admin@example.com", plan: "free", role: "admin", banned: false, emailVerified: true, banExpires: null, isDirector: false },
    });
    const tenantId = await getCurrentTenantIdOrNull();
    expect(tenantId).toBe("user-456");
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
