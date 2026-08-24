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
import { LocaleLink } from "@/components/locale-link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  children: ReactNode;
  active?: boolean;
  className?: string;
  target?: "_blank";
  /** 提供 onClick 时渲染为按钮(不跳转),用于客户点击"仪表盘"触发升级 */
  onClick?: () => void;
};

export function NavBarItem({
  children,
  href,
  active,
  target,
  className,
  onClick,
}: Props) {
  const pathname = usePathname();

  const itemClassName = cn(
    "flex items-center justify-center text-sm leading-[110%] px-4 py-2 rounded-md hover:bg-hover text-muted-foreground",
    (active || pathname?.includes(href)) &&
      "bg-accent text-foreground",
    className
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={itemClassName}>
        {children}
      </button>
    );
  }

  return (
    <LocaleLink
      href={href}
      className={itemClassName}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
    >
      {children}
    </LocaleLink>
  );
}
