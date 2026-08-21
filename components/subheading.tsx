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

type SubheadingTag = "p" | "span" | "div";

type SubheadingProps = {
  className?: string;
  as?: SubheadingTag;
  children: React.ReactNode;
} & MotionProps &
  React.HTMLAttributes<HTMLElement>;

export const Subheading = ({
  className,
  as: Tag = "p",
  children,
  ...props
}: SubheadingProps) => {
  return (
    <Tag
      className={cn(
        "text-sm md:text-base  max-w-4xl text-left my-4 mx-auto",
        "text-muted-foreground text-center font-normal",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
};
