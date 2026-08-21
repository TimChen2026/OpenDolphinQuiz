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

import Script from "next/script";

export type ClarityAnalyticsProps = {
  readonly projectId?: string;
};

export default function ClarityAnalytics({ projectId }: ClarityAnalyticsProps = {}) {
  const clarityProjectId = projectId ?? process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  if (!clarityProjectId) {
    return null;
  }

  const sanitizedId = clarityProjectId.trim();

  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);
          t.async=1;
          t.src="https://www.clarity.ms/tag/${sanitizedId}";
          y=l.getElementsByTagName(r)[0];
          y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${sanitizedId}");
      `}
    </Script>
  );
}
