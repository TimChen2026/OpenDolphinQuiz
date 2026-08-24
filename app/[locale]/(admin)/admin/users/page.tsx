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

import { getTranslations } from "next-intl/server";
import { UsersTable } from "@/features/admin/components/users-table";
import {
  type AdminUsersDirectorySearchParams,
  getAdminUsersDirectory,
} from "@/lib/admin-user-directory";
import type { Locale } from "@/i18n.config";

interface AdminUsersPageProps {
  params: Promise<{
    locale: Locale;
  }>;
  searchParams?: Promise<AdminUsersDirectorySearchParams>;
}

export default async function AdminUsersPage(props: AdminUsersPageProps) {
  const params = await props.params;

  const {
    locale
  } = params;

  const searchParams = await props.searchParams;
  const t = await getTranslations({ locale, namespace: "Admin.users" });
  const directory = await getAdminUsersDirectory(searchParams);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          {t("title")}
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {directory.query
              ? t("matchingUsers", {
                  count: directory.totalUsers,
                  query: directory.query,
                })
              : t("totalUsers", { count: directory.totalUsers })}
          </div>
        </div>
      </div>

      <UsersTable
        currentPage={directory.currentPage}
        pageSize={directory.pageSize}
        query={directory.query}
        role={directory.role}
        plan={directory.plan}
        accountType={directory.accountType}
        emailVerified={directory.emailVerified}
        team={directory.team}
        totalPages={directory.totalPages}
        totalUsers={directory.totalUsers}
        users={directory.users}
      />
    </div>
  );
}
