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

import { ModeToggle } from "@/components/mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslations } from "next-intl";
import { UserMenu } from "@/features/navigation/components/user-menu";
import { Shield } from "lucide-react";

export function AdminHeader() {
  const tSidebar = useTranslations("Admin.sidebar");

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="flex items-center justify-between px-8 py-4 gap-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground">
            {tSidebar("title")}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <LanguageSwitcher />
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
