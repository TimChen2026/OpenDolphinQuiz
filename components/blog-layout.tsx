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

"use client";

import { BlogWithSlug } from "@/lib/blog";
import { IconArrowLeft } from "@tabler/icons-react";
import { Container } from "./container";
import Image from "next/image";
import { Logo } from "./Logo";
import Link from "next/link";
import { format } from "date-fns";
export function BlogLayout({
  blog,
  children,
}: {
  blog: BlogWithSlug;
  children: React.ReactNode;
}) {
  return (
    <Container className="mt-16 lg:mt-32">
      <div className="flex justify-between items-center px-2 py-8">
        <Link href="/blog" className="flex space-x-2 items-center">
          <IconArrowLeft className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Back</span>
        </Link>
        <div className="flex space-x-2 items-center">
          <div className="flex space-x-2 items-center ">
            <Image
              src={blog.author.src}
              alt={blog.author.name}
              width={20}
              height={20}
              className="rounded-full h-5 w-5"
            />
            <p className="text-sm font-normal text-muted-foreground">
              {blog.author.name}
            </p>
          </div>
          <div className="h-5 rounded-lg w-0.5 bg-border" />
          <time dateTime={blog.date} className="flex items-center text-base ">
            <span className="text-muted-foreground text-sm">
              {format(new Date(blog.date), "MMMM dd, yyyy")}
            </span>
          </time>
        </div>
      </div>
      <div className="max-w-4xl mx-auto">
        {blog.image ? (
          <Image
            src={blog.image}
            height="800"
            width="800"
            className="h-20 md:h-48 w-full aspect-square object-cover rounded-3xl"
            alt={blog.title}
          />
        ) : (
          <div className="h-40 md:h-96 w-full aspect-squace rounded-3xl shadow-derek bg-card flex items-center justify-center">
            <Logo />
          </div>
        )}
      </div>
      <div className="xl:relative">
        <div className="mx-auto max-w-2xl">
          <article className="pb-8">
            <header className="flex flex-col">
              <h1 className="mt-8 text-4xl font-bold tracking-tight text-foreground sm:text-5xl ">
                {blog.title}
              </h1>
            </header>
            <div
              className="mt-8 prose prose-sm dark:prose-invert"
              data-mdx-content
            >
              {children}
            </div>
          </article>
        </div>
      </div>
    </Container>
  );
}
