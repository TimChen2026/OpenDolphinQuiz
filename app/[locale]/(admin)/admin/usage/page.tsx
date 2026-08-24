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
import { getAdminUsageSummary } from "@/lib/admin-usage";
import { AdminUsageTable } from "@/features/admin/components/admin-usage-table";
import type { Locale } from "@/i18n.config";

interface AdminUsagePageProps {
  params: Promise<{
    locale: Locale;
  }>;
}

/**
 * 管理后台 - 权限使用汇总页
 *
 * 按团队展示套餐配额(Quiz 问卷 / 潜在客户)的已用与上限,
 * 权限口径与定价页关键指标一致。
 */
export default async function AdminUsagePage(props: AdminUsagePageProps) {
  const params = await props.params;

  const { locale } = params;

  const t = await getTranslations({ locale, namespace: "Admin.usage" });
  const items = await getAdminUsageSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("description")}</p>
      </div>

      <AdminUsageTable items={items} />
    </div>
  );
}
