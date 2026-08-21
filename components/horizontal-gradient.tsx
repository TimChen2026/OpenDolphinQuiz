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
import { cn } from "@/lib/utils";
import { useId } from "react";

type HorizontalGradientProps = React.SVGProps<SVGSVGElement> & {
  className?: string;
};

export const HorizontalGradient = ({
  className,
  ...props
}: HorizontalGradientProps) => {
  const id = useId();
  return (
    <svg
      width="1595"
      height="2"
      viewBox="0 0 1595 2"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "absolute w-full object-contain pointer-events-none",
        className
      )}
      {...props}
    >
      <path
        d="M0 1H1594.5"
        stroke={`url(#line-path-gradient-${id})`}
        strokeDasharray="8 8"
      />

      <defs>
        <linearGradient
          id={`line-path-gradient-${id}`}
          x1="0"
          y1="1.5"
          x2="1594.5"
          y2="1.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0" />
          <stop offset="0.2" stopColor="var(--neutral-400)" />
          <stop offset="0.8" stopColor="var(--neutral-400)" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
};
