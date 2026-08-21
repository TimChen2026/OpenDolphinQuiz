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

import { cn } from "@/lib/utils";
import { MotionProps } from "framer-motion";
import React from "react";

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

type HeadingProps = {
  className?: string;
  as?: HeadingTag;
  children: React.ReactNode;
  size?: "sm" | "md" | "xl" | "2xl";
} & MotionProps &
  React.HTMLAttributes<HTMLHeadingElement>;

export const Heading = ({
  className,
  as: Tag = "h2",
  children,
  size = "md",
  ...props
}: HeadingProps) => {
  const sizeVariants = {
    sm: "text-xl md:text-2xl md:leading-snug",
    md: "text-3xl md:text-5xl md:leading-tight",
    xl: "text-4xl md:text-6xl md:leading-none",
    "2xl": "text-5xl md:text-7xl md:leading-none",
  };
  return (
    <Tag
      className={cn(
        "text-3xl md:text-5xl md:leading-tight max-w-5xl mx-auto text-center tracking-tight",
        "font-medium",
        "text-foreground",
        sizeVariants[size],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
};
