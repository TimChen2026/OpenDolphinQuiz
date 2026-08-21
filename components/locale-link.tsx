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

import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { useLocale } from 'next-intl';

interface LocaleLinkProps extends Omit<ComponentProps<typeof Link>, "href"> {
  href: string;
  children: ReactNode;
}

export function LocaleLink({ href, children, ...props }: LocaleLinkProps) {
  const locale = useLocale();

  if (href.startsWith('http') || href.startsWith('//')) {
    return <Link href={href} {...props}>{children}</Link>;
  }

  const normalizedHref = href.startsWith('/') ? href : `/${href}`;

  if (
    normalizedHref === `/${locale}` ||
    normalizedHref.startsWith(`/${locale}/`)
  ) {
    return <Link href={normalizedHref} {...props}>{children}</Link>;
  }

  const localizedHref = `/${locale}${normalizedHref === '/' ? '' : normalizedHref}`;

  return <Link href={localizedHref} {...props}>{children}</Link>;
}
