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

import { getGoogleAuthProvider, isGoogleAuthEnabled } from "@/lib/auth/google-auth";

describe("google auth config", () => {
  it("enables Google auth only when both credentials are present", () => {
    expect(
      isGoogleAuthEnabled({
        AUTH_GOOGLE_ID: "client-id",
        AUTH_GOOGLE_SECRET: "client-secret",
      }),
    ).toBe(true);

    expect(
      isGoogleAuthEnabled({
        AUTH_GOOGLE_ID: "client-id",
      }),
    ).toBe(false);

    expect(
      isGoogleAuthEnabled({
        AUTH_GOOGLE_SECRET: "client-secret",
      }),
    ).toBe(false);
  });

  it("trims credentials and returns a provider config only when complete", () => {
    expect(
      getGoogleAuthProvider({
        AUTH_GOOGLE_ID: "  client-id  ",
        AUTH_GOOGLE_SECRET: "  client-secret  ",
      }),
    ).toEqual({
      clientId: "client-id",
      clientSecret: "client-secret",
    });

    expect(
      getGoogleAuthProvider({
        AUTH_GOOGLE_ID: "client-id",
        AUTH_GOOGLE_SECRET: "   ",
      }),
    ).toBeNull();
  });
});
