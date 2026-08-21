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

import type { ComponentType } from "react";

import { defaultLocale } from "@/i18n.config";

import { blogModuleLoaders } from "./blog-manifest.generated";

interface Blog {
  title: string;
  description: string;
  author: {
    name: string;
    src: string;
  };
  date: string;
  image?: string;
}

export interface BlogWithSlug extends Blog {
  slug: string;
}

type BlogModule = {
  default: ComponentType;
  blog: Blog;
};

type BlogModuleLoader = () => Promise<BlogModule>;

type BlogModuleMap = Record<string, Record<string, BlogModuleLoader>>;

const blogModuleMap: BlogModuleMap = Object.fromEntries(
  Object.entries(blogModuleLoaders).map(([slug, locales]) => [
    slug,
    Object.fromEntries(
      Object.entries(locales).map(([locale, loader]) => [
        locale,
        async () => (await loader()) as BlogModule,
      ])
    ),
  ])
);

async function loadBlog(slug: string, locale: string) {
  const locales = blogModuleMap[slug];

  if (!locales) {
    return null;
  }

  const loader =
    locales[locale] ??
    locales[defaultLocale] ??
    Object.values(locales)[0];

  if (!loader) {
    return null;
  }

  const mod = await loader();

  return mod;
}

export async function getBlogModule(slug: string, locale: string) {
  return loadBlog(slug, locale);
}

export async function getAllBlogs(locale: string = defaultLocale) {
  const slugs = Object.keys(blogModuleMap);

  const blogs = await Promise.all(
    slugs.map(async (slug) => {
      const mod = await loadBlog(slug, locale);

      if (!mod) {
        return null;
      }

      return {
        slug,
        ...mod.blog,
      } satisfies BlogWithSlug;
    })
  );

  return blogs
    .filter((blog): blog is BlogWithSlug => blog !== null)
    .sort((a, z) => +new Date(z.date) - +new Date(a.date));
}
