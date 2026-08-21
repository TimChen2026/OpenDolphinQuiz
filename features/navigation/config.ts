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

import type { NavigationItem } from "./types";

type NavigationKeySubItem = {
  key: string;
  href: string;
  icon?: string;
};

type NavigationKeyItem = {
  key: string;
  href: string;
  target?: "_blank";
  subItems?: NavigationKeySubItem[];
};

// These are the navigation keys for translation
export const marketingNavigationKeys: NavigationKeyItem[] = [
  {
    key: "dashboard",
    href: "/dashboard",
  },
  {
    key: "pricing",
    href: "/pricing",
  },
  {
    key: "blog",
    href: "/blog",
  },
  {
    key: "contact",
    href: "/contact",
  },
  {
    key: "docs",
    href: "/docs",
    target: "_blank",
  },
];

export const appNavigationKeys: NavigationKeyItem[] = [
  {
    key: "dashboard",
    href: "/dashboard",
  },
  {
    key: "settings",
    href: "/settings",
  },
  {
    key: "profile",
    href: "/profile",
  },
];

// Legacy exports for compatibility
export const marketingNavigation: NavigationItem[] = [
  {
    title: "Pricing",
    href: "/pricing",
  },
  {
    title: "Blog",
    href: "/blog",
  },
  {
    title: "Contact",
    href: "/contact",
  },
  {
    title: "Docs",
    href: "/docs",
    target: "_blank",
  },
];

export const appNavigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Settings",
    href: "/settings",
  },
  {
    title: "Profile",
    href: "/profile",
  },
];
