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

// 审计日志测试(Phase 4,AC-13)
import { describe, it, expect, vi, beforeEach } from "vitest";
import { logAudit, getAuditLogs } from "@/lib/dashboard/audit-log";
import { AUDIT_ACTION_TYPES } from "@/lib/db/schema";

// Mock crypto.randomUUID
const mockRandomUUID = "test-id-123";
vi.stubGlobal("crypto", {
  randomUUID: vi.fn().mockReturnValue(mockRandomUUID),
});

// Mock db
vi.mock("@/lib/db", () => ({
  db: {
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    }),
  },
}));

describe("logAudit", () => {
  it("should insert audit log with all fields", async () => {
    const { db } = await import("@/lib/db");
    await logAudit({
      userId: "user-1",
      actionType: "export",
      description: "Export project data (367 records)",
      ipAddress: "127.0.0.1",
    });

    expect(db.insert).toHaveBeenCalled();
    const insertMock = (db.insert as any).mock.results[0].value;
    expect(insertMock.values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockRandomUUID,
        userId: "user-1",
        actionType: "export",
        description: "Export project data (367 records)",
        details: null,
        ipAddress: "127.0.0.1",
      })
    );
  });

  it("should handle optional ipAddress", async () => {
    const { db } = await import("@/lib/db");
    await logAudit({
      userId: "user-1",
      actionType: "login",
      description: "用户登录",
    });

    const insertMock = (db.insert as any).mock.results[0].value;
    expect(insertMock.values).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockRandomUUID,
        ipAddress: null,
      })
    );
  });
});

describe("getAuditLogs", () => {
  it("should query audit logs for user", async () => {
    const logs = await getAuditLogs("user-1");
    expect(Array.isArray(logs)).toBe(true);
  });

  it("should support pagination", async () => {
    const logs = await getAuditLogs("user-1", { limit: 10, offset: 0 });
    expect(Array.isArray(logs)).toBe(true);
  });
});