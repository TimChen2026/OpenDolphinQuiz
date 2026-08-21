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

import { getResendClient, sendEmail } from "@/lib/email";

describe("email client", () => {
  it("does not construct a resend client when the API key is missing", () => {
    expect(getResendClient(undefined)).toBeNull();
  });

  it("returns a controlled error instead of throwing when email is disabled", async () => {
    const originalKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;

    try {
      await expect(
        sendEmail({
          to: "user@example.com",
          subject: "Hello",
          html: "<p>Test</p>",
        })
      ).resolves.toMatchObject({
        success: false,
      });
    } finally {
      if (originalKey) {
        process.env.RESEND_API_KEY = originalKey;
      }
    }
  });
});
