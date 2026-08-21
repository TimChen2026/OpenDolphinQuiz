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

import type { Metadata } from "next";
import { defaultLocale, locales, type Locale } from "@/i18n.config";
import { websiteConfig } from "@/constants/website";

const ogLocaleByLocale: Record<Locale, string> = {
  en: "en_US",
  zh: "zh_CN",
};

export function getDocsPath(locale: string, slug: string[] = []) {
  const docsPrefix = locale === defaultLocale ? "/docs" : `/${locale}/docs`;

  if (slug.length === 0) {
    return docsPrefix;
  }

  return `${docsPrefix}/${slug.join("/")}`;
}

export function getDocsDescription(
  locale: string,
  title: string,
  description?: string | null,
) {
  const normalizedDescription = description?.trim();

  if (normalizedDescription) {
    return normalizedDescription;
  }

  if (locale === "zh") {
    return `${title} 的使用文档，来自 ${websiteConfig.docsName}。`;
  }

  return `${title} documentation from ${websiteConfig.docsName}.`;
}

export function getDocsMetadata(input: {
  locale: Locale;
  slug?: string[];
  title: string;
  description?: string | null;
}): Metadata {
  const { locale, slug = [], title, description } = input;
  const resolvedDescription = getDocsDescription(locale, title, description);
  const path = getDocsPath(locale, slug);
  const absoluteUrl = new URL(path, websiteConfig.appUrl).toString();
  const pageTitle = `${title} | ${websiteConfig.docsName}`;

  return {
    title: pageTitle,
    description: resolvedDescription,
    alternates: {
      canonical: absoluteUrl,
      languages: Object.fromEntries(
        locales.map((supportedLocale) => [
          supportedLocale,
          new URL(getDocsPath(supportedLocale, slug), websiteConfig.appUrl).toString(),
        ]),
      ),
    },
    openGraph: {
      title: pageTitle,
      description: resolvedDescription,
      url: absoluteUrl,
      siteName: websiteConfig.docsName,
      locale: ogLocaleByLocale[locale],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: resolvedDescription,
    },
  };
}
