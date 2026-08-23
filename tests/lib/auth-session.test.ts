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

import { isBanActive, resolveSessionAccess } from "@/lib/auth/session";

describe("auth session access", () => {
  it("treats permanent bans as active", () => {
    expect(
      isBanActive({
        banned: true,
        banExpires: null,
      })
    ).toBe(true);
  });

  it("ignores expired temporary bans", () => {
    expect(
      isBanActive(
        {
          banned: true,
          banExpires: new Date("2025-01-01T00:00:00.000Z"),
        },
        {
          now: new Date("2025-02-01T00:00:00.000Z"),
        }
      )
    ).toBe(false);
  });

  it("blocks banned users from active sessions", () => {
    expect(
      resolveSessionAccess({
        id: "user-1",
        email: "user@example.com",
        plan: "free",
        banned: true,
        banExpires: null,
        emailVerified: true,
        role: "user",
        isDirector: false,
        accountType: "member",
        teamId: null,
      })
    ).toEqual({
      ok: false,
      error: "User is banned",
      status: 403,
    });
  });

  it("allows active users through", () => {
    expect(
      resolveSessionAccess({
        id: "user-1",
        email: "user@example.com",
        plan: "free",
        banned: false,
        banExpires: null,
        emailVerified: true,
        role: "user",
        isDirector: false,
        accountType: "member",
        teamId: null,
      })
    ).toEqual({
      ok: true,
      user: {
        id: "user-1",
        email: "user@example.com",
        plan: "free",
        banned: false,
        banExpires: null,
        emailVerified: true,
        role: "user",
        isDirector: false,
        accountType: "member",
        teamId: null,
      },
    });
  });
});
