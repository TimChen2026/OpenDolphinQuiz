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

import React from "react";
import Link from "next/link";
import { BlurImage } from "./blur-image";
import { Logo } from "./Logo";
import Image from "next/image";
import { BlogWithSlug } from "@/lib/blog";

export const BlogCard = ({ blog }: { blog: BlogWithSlug }) => {
  const truncate = (text: string, length: number) => {
    return text.length > length ? text.slice(0, length) + "..." : text;
  };
  return (
    <Link
      className="shadow-derek rounded-3xl border border-border w-full bg-card text-card-foreground  overflow-hidden  hover:scale-[1.02] transition duration-200"
      href={`/blog/${blog.slug}`}
    >
      {blog.image ? (
        <BlurImage
          src={blog.image || ""}
          alt={blog.title}
          height="800"
          width="800"
          className="h-52 object-cover object-top w-full"
        />
      ) : (
        <div className="h-52 flex items-center justify-center bg-card">
          <Logo />
        </div>
      )}
      <div className="p-4 md:p-8 bg-card">
        <div className="flex space-x-2 items-center  mb-2">
          <Image
            src={blog.author.src}
            alt={blog.author.name}
            width={20}
            height={20}
            className="rounded-full h-5 w-5"
          />
          <p className="text-sm font-normal text-muted-foreground">{blog.author.name}</p>
        </div>
        <p className="text-lg font-bold mb-4 text-foreground">
          {blog.title}
        </p>
        <p className="text-left text-sm mt-2 text-muted-foreground">
          {truncate(blog.description, 100)}
        </p>
      </div>
    </Link>
  );
};
