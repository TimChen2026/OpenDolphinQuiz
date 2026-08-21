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

const toBoolean = (value: string | undefined): boolean =>
  value?.toLowerCase() === "true";

const DEFAULT_APP_URL = "http://localhost:3000";

export const analyticsConfig = {
  enableInDevelopment: toBoolean(process.env.NEXT_PUBLIC_ANALYTICS_ENABLE_IN_DEVELOPMENT),
};

export const websiteConfig = {
  appName: "DolphinQuiz",
  docsName: "DolphinQuiz Docs",
  appUrl: (process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL).trim(),
};
