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

import {
  ADMIN_USERS_PAGE_SIZE,
  getAdminUsersTotalPages,
  normalizeAdminUsersDirectoryFilters,
} from "@/lib/admin-user-directory";

describe("admin user directory helpers", () => {
  it("normalizes search params into a trimmed query and safe page number", () => {
    expect(
      normalizeAdminUsersDirectoryFilters({
        query: "  alice@example.com  ",
        page: "3",
      })
    ).toEqual({
      currentPage: 3,
      pageSize: ADMIN_USERS_PAGE_SIZE,
      query: "alice@example.com",
    });
  });

  it("falls back to the first page for invalid input and array params", () => {
    expect(
      normalizeAdminUsersDirectoryFilters({
        query: ["  DolphinQuiz  ", "ignored"],
        page: ["0", "2"],
      })
    ).toEqual({
      currentPage: 1,
      pageSize: ADMIN_USERS_PAGE_SIZE,
      query: "DolphinQuiz",
    });
  });

  it("keeps pagination stable even when there are no users", () => {
    expect(getAdminUsersTotalPages(0)).toBe(1);
    expect(getAdminUsersTotalPages(41)).toBe(3);
  });
});
