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

import { ReactNode } from "react";

import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

interface AuthMessageCardProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function AuthMessageCard({
  title,
  description,
  children,
  className,
}: AuthMessageCardProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24",
        className
      )}
    >
      <div className="mx-auto w-full max-w-md">
        <div>
          <div className="flex">
            <Logo />
          </div>
          <h2 className="mt-8 text-2xl font-bold leading-9 tracking-tight text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        {children ? <div className="mt-10 space-y-4">{children}</div> : null}
      </div>
    </div>
  );
}
