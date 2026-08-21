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

import { type Metadata } from "next";
import { getAllBlogs } from "@/lib/blog";
import { Background } from "@/components/background";
import { Container } from "@/components/container";
import { Heading } from "@/components/heading";
import { Subheading } from "@/components/subheading";
import { BlogCard } from "@/components/blog-card";
import { getTranslations } from 'next-intl/server';
import { type Locale } from '@/i18n.config';
import { generatePageMetadata } from "@/lib/metadata";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: Locale }>
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'blog' });

  return generatePageMetadata({
    locale: params.locale,
    path: '/blog',
    title: t('title'),
    description: t('subtitle'),
  });
}

interface PageProps {
  params: Promise<{
    locale: Locale;
  }>;
}

export default async function ArticlesIndex(props: PageProps) {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'blog' });
  const blogs = await getAllBlogs(params.locale);

  return (
    <div className="relative overflow-hidden py-20 md:py-0">
      <Background />
      <Container className="flex flex-col items-center justify-between pb-20">
        <div className="relative z-20 py-10 md:pt-40">
          <Heading as="h1">{t('title')}</Heading>
          <Subheading className="text-center">
            {t('subtitle')}
          </Subheading>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-20 w-full mb-10">
          {blogs.slice(0, 2).map((blog, index) => (
            <BlogCard blog={blog} key={blog.title + index} />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full relative z-20">
          {blogs.slice(2).map((blog, index) => (
            <BlogCard blog={blog} key={blog.title + index} />
          ))}
        </div>
      </Container>
    </div>
  );
}
