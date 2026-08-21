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

import { source } from '@/lib/source';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  DocsPage,
  DocsBody,
  DocsTitle,
  DocsDescription,
} from 'fumadocs-ui/page';
import { getMDXComponents } from '@/mdx-components';
import { getDocsDescription, getDocsMetadata } from '@/lib/docs-metadata';
import type { Locale } from '@/i18n.config';

type DocsPageProps = {
  params: Promise<{ slug?: string[]; locale: Locale }>;
};

export async function generateMetadata({
  params,
}: DocsPageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const page = source.getPage(slug, locale);

  if (!page) {
    notFound();
  }

  return getDocsMetadata({
    locale,
    slug,
    title: page.data.title,
    description: page.data.description,
  });
}

export default async function Page({
  params,
}: DocsPageProps) {
  const { slug, locale } = await params;
  const page = source.getPage(slug, locale);

  if (!page) notFound();

  const Mdx = page.data.body;

  return (
    <DocsPage toc={page.data.toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>
        {getDocsDescription(locale, page.data.title, page.data.description)}
      </DocsDescription>
      <DocsBody>
        <Mdx components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  // In development, avoid enumerating every docs slug up front.
  // This keeps the first /docs request responsive while production builds
  // still prerender the full docs tree.
  if (process.env.NODE_ENV !== 'production') {
    return [];
  }

  return source.generateParams('slug', 'locale');
}
