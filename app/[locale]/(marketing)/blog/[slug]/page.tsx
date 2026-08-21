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
import { notFound } from "next/navigation";

import { getAllBlogs, getBlogModule } from "@/lib/blog";
import { locales, type Locale } from "@/i18n.config";

interface PageProps {
  params: Promise<{
    locale: Locale;
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const blogs = await getAllBlogs();

  return blogs.flatMap((blog) =>
    locales.map((locale) => ({
      slug: blog.slug,
      locale,
    }))
  );
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const { slug, locale } = params;

  const blogModule = await getBlogModule(slug, locale);

  if (!blogModule) {
    notFound();
  }

  const { blog } = blogModule;
  const metadata: Metadata = {
    title: blog.title,
    description: blog.description,
  };

  if (blog.image) {
    metadata.openGraph = {
      images: [blog.image],
    };
  }

  return metadata;
}

export default async function BlogPostPage(props: PageProps) {
  const params = await props.params;
  const { slug, locale } = params;

  const blogModule = await getBlogModule(slug, locale);

  if (!blogModule) {
    notFound();
  }

  const MDXContent = blogModule.default;

  return <MDXContent />;
}
