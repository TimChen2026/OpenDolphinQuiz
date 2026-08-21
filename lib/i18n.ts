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

import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n.config';

export default getRequestConfig(async ({ locale }) => {
  // If locale is undefined, use default locale
  if (!locale) {
    const messages = (await import(`../messages/en.json`)).default;
    const seoMessages = (await import(`../messages/seo.en.json`)).default;
    return {
      locale: 'en',
      messages: {
        ...messages,
        seo: seoMessages
      }
    };
  }
  
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  try {
    const messages = (await import(`../messages/${locale}.json`)).default;
    const seoMessages = (await import(`../messages/seo.${locale}.json`)).default;
    return {
      locale,
      messages: {
        ...messages,
        seo: seoMessages
      }
    };
  } catch (error) {
    console.error('Error loading messages for locale:', locale, error);
    notFound();
  }
});
