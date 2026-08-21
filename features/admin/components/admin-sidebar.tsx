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

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Users,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  {
    title: "dashboard",
    href: "/admin",
    icon: Home,
  },
  {
    title: "users",
    href: "/admin/users",
    icon: Users,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("Admin.sidebar");

  return (
    <div className="w-64 bg-background border-r border-border sticky top-0">
      <div className="flex h-screen flex-col">
        <div className="px-6 pt-16 pb-8 border-b border-border">
          <Link
            href={`/${locale}/dashboard`}
            className="flex items-center gap-2 justify-center w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-hover hover:text-hover-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            {t("backToDashboard")}
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const href = `/${locale}${item.href}`;
            const isActive = pathname === href || pathname.startsWith(href + "/");

            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-hover hover:text-hover-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {t(item.title)}
              </Link>
            );
          })}
        </nav>

      </div>
    </div>
  );
}
