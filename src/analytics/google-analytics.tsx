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

export type GoogleAnalyticsProps = {
  readonly trackingId?: string;
};

export default function GoogleAnalytics({ trackingId }: GoogleAnalyticsProps = {}) {
  const gaTrackingId = trackingId ?? process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;

  if (!gaTrackingId) {
    return null;
  }

  const sanitizedId = gaTrackingId.trim();

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(sanitizedId)}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${sanitizedId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
