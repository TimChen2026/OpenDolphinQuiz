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

// Admin Panel · Unsubscribe 板块(GDPR 合规退订机制)
//
// 上半部分:生成退订链接(输入邮箱 → 加密 Token 链接 → 复制,
// 供手动添加到 Outlook / Foxmail / 邮件模板)
// 下半部分:已退订邮箱列表(邮箱脱敏展示,符合隐私最小化原则)

import { getTranslations } from "next-intl/server";
import { desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { unsubscribers } from "@/lib/db/schema";
import { UnsubscribeLinkGenerator } from "@/features/admin/components/unsubscribe-link-generator";
import type { Locale } from "@/i18n.config";

interface AdminUnsubscribersPageProps {
  params: Promise<{
    locale: Locale;
  }>;
}

/** 邮箱脱敏:保留前 2 位与域名,中间以 * 代替(如 an***@example.com) */
function maskEmail(email: string): string {
  return email.replace(/^(.{2})(.*)(@.*)$/, (_match, head, middle, domain) => {
    return middle ? `${head}${"*".repeat(middle.length)}${domain}` : email;
  });
}

export default async function AdminUnsubscribersPage(
  props: AdminUnsubscribersPageProps
) {
  const params = await props.params;
  const t = await getTranslations({
    locale: params.locale,
    namespace: "Admin.unsubscribe",
  });

  const rows = await db
    .select({
      id: unsubscribers.id,
      email: unsubscribers.email,
      source: unsubscribers.source,
      unsubscribedAt: unsubscribers.unsubscribedAt,
    })
    .from(unsubscribers)
    .orderBy(desc(unsubscribers.unsubscribedAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <UnsubscribeLinkGenerator />

      <section className="rounded-2xl border border-border bg-background">
        <h2 className="px-6 pt-6 text-lg font-semibold text-foreground">
          {t("list.title")}
        </h2>

        {rows.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">
            {t("list.emptyState")}
          </p>
        ) : (
          <div className="overflow-x-auto px-6 pb-6 pt-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">
                    {t("list.columns.email")}
                  </th>
                  <th className="py-2 pr-4 font-medium">
                    {t("list.columns.source")}
                  </th>
                  <th className="py-2 font-medium">
                    {t("list.columns.unsubscribedAt")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="py-3 pr-4 font-mono text-xs text-foreground">
                      {maskEmail(row.email)}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {row.source ?? "-"}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {row.unsubscribedAt.toISOString().slice(0, 19).replace("T", " ")} UTC
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
