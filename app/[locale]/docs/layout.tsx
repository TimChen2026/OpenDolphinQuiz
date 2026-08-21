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

import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { RootProvider } from 'fumadocs-ui/provider/next';
import type { ReactNode } from 'react';
import { source } from '@/lib/source';
import { getDocsBaseOptions, docsI18nUI } from '@/lib/docs-ui';
import { localizeDocsPageTree } from '@/lib/docs-page-tree';

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}) {
  const { locale } = await params;

  return (
    <>
      {/* Loaded outside Tailwind v3/PostCSS to avoid parsing Tailwind v4-specific Fumadocs CSS. */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/fumadocs-style.css" />
      <RootProvider i18n={docsI18nUI.provider(locale)}>
        <DocsLayout
          {...getDocsBaseOptions(locale)}
          tree={localizeDocsPageTree(locale, source.getPageTree(locale))}
        >
          {children}
        </DocsLayout>
      </RootProvider>
    </>
  );
}
