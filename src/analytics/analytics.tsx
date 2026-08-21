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

import GoogleAnalytics from "./google-analytics";
import ClarityAnalytics from "./clarity-analytics";
import { analyticsConfig } from "@/constants/website";

export type AnalyticsProps = {
  readonly forceEnableInDevelopment?: boolean;
};

export function Analytics({ forceEnableInDevelopment = false }: AnalyticsProps = {}) {
  const { enableInDevelopment } = analyticsConfig;

  if (
    process.env.NODE_ENV !== "production" &&
    !enableInDevelopment &&
    !forceEnableInDevelopment
  ) {
    return null;
  }

  return (
    <>
      <GoogleAnalytics />
      <ClarityAnalytics />
    </>
  );
}

export default Analytics;
