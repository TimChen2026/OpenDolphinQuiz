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
import { verifyPassport, PASSPORT_EXPIRY_HOURS } from "@/lib/passport";

vi.mock("@/lib/db", () => ({
  db: {
    query: {
      user: {
        findFirst: vi.fn(),
      },
    },
  },
}));

describe("passport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("PASSPORT_EXPIRY_HOURS 为 24", () => {
    expect(PASSPORT_EXPIRY_HOURS).toBe(24);
  });

  it("verifyPassport 状态为verified且未过期时返回valid", async () => {
    const { db } = await import("@/lib/db");
    // 测试仅需passport相关字段,使用as never满足findFirst的完整类型约束
    vi.mocked(db.query.user.findFirst).mockResolvedValue({
      id: "user-1",
      passportStatus: "verified",
      passportVerifiedAt: new Date(),
      passportExpiresAt: new Date(Date.now() + 3600000),
    } as never);
    const result = await verifyPassport("user-1");
    expect(result.valid).toBe(true);
  });

  it("verifyPassport 状态为unverified时返回invalid", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.query.user.findFirst).mockResolvedValue({
      id: "user-1",
      passportStatus: "unverified",
      passportVerifiedAt: null,
      passportExpiresAt: null,
    } as never);
    const result = await verifyPassport("user-1");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("unverified");
  });

  it("verifyPassport 已过期时返回invalid", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.query.user.findFirst).mockResolvedValue({
      id: "user-1",
      passportStatus: "verified",
      passportVerifiedAt: new Date(Date.now() - 50000),
      passportExpiresAt: new Date(Date.now() - 1000),
    } as never);
    const result = await verifyPassport("user-1");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("expired");
  });
});
