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

import { defineI18nUI } from 'fumadocs-ui/i18n';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { defaultLocale, localeNames } from '@/i18n.config';
import { docsI18n } from '@/lib/docs-i18n';
import { websiteConfig } from '@/constants/website';

export const docsI18nUI = defineI18nUI(docsI18n, {
  translations: {
    en: {
      displayName: localeNames.en,
      search: 'Search docs',
    },
    zh: {
      displayName: localeNames.zh,
      search: '搜索文档',
      searchNoResult: '没有找到结果',
      previousPage: '上一页',
      nextPage: '下一页',
      chooseLanguage: '切换语言',
    },
  },
});

export function getDocsBaseOptions(locale: string): BaseLayoutProps {
  return {
    i18n: docsI18n,
    nav: {
      title: locale === 'zh' ? 'DolphinQuiz 文档' : websiteConfig.docsName,
      url: locale === defaultLocale ? '/docs' : `/${locale}/docs`,
    },
  };
}
