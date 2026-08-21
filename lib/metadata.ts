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

import { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface GenerateMetadataProps {
  locale: string
  path: string
  title: string
  description: string
  ogImage?: string
}

export function generatePageMetadata({
  locale,
  path,
  title,
  description,
  ogImage = `${baseUrl}/og-image.png`,
}: GenerateMetadataProps): Metadata {
  const canonicalUrl = `${baseUrl}/${locale}${path}`

  // Generate alternate language URLs
  const alternates = {
    canonical: canonicalUrl,
    languages: {
      'zh-CN': `${baseUrl}/zh${path}`,
      'en-US': `${baseUrl}/en${path}`,
      'x-default': `${baseUrl}/zh${path}`, // Default to Chinese
    },
  }

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'DolphinQuiz',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}
