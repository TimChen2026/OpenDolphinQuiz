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
import React from "react";

type ButtonOwnProps<T extends React.ElementType> = {
  children?: React.ReactNode;
  className?: string;
  variant?: "simple" | "outline" | "primary";
  size?: "sm" | "md" | "lg";
  as?: T;
};

type ButtonProps<T extends React.ElementType> = ButtonOwnProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof ButtonOwnProps<T>>;

export function Button<T extends React.ElementType = "button">({
  children,
  className,
  variant = "primary",
  size = "md",
  as,
  ...props
}: ButtonProps<T>) {
  const Tag = (as ?? "button") as React.ElementType;
  const sizeClass =
    size === "sm"
      ? "text-xs px-3 py-1.5"
      : size === "lg"
      ? "text-base px-6 py-3"
      : "text-sm md:text-sm px-4 py-2";

  const variantClass =
    variant === "simple"
      ? "bg-transparent hover:bg-hover border border-transparent text-foreground hover:text-hover-foreground transition font-medium duration-200 rounded-full flex items-center justify-center"
      : variant === "outline"
      ? "bg-background hover:bg-primary hover:shadow-xl text-foreground border border-border hover:text-primary-foreground transition font-medium duration-200 rounded-full flex items-center justify-center"
      : variant === "primary"
      ? "bg-primary hover:bg-primary/90 border border-transparent text-primary-foreground transition font-medium duration-200 rounded-full flex items-center justify-center shadow-[0px_-1px_0px_0px_rgba(255,255,255,0.25)_inset,_0px_1px_0px_0px_rgba(255,255,255,0.25)_inset]"
      : "";
  return (
    <Tag
      className={cn(
        "relative z-10",
        variantClass,
        sizeClass,
        className
      )}
      {...props}
    >
      {children ?? `Get Started`}
    </Tag>
  );
}
