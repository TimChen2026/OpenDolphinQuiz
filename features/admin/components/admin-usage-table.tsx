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

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { AdminUsageSummaryItem } from "@/lib/admin-usage";

type AdminUsageTableProps = {
  items: AdminUsageSummaryItem[];
};

/**
 * 权限使用汇总表(管理后台)
 *
 * 按团队一行展示:管理员、套餐、Quiz 问卷与潜在客户的已用/上限,
 * 达到上限时以警示色标注,便于管理员一目了然掌握各团队配额使用情况。
 */
export function AdminUsageTable({ items }: AdminUsageTableProps) {
  const t = useTranslations("Admin.usage");

  return (
    <div className="bg-background rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary">
            <tr>
              {[
                "team",
                "admin",
                "plan",
                "quizUsage",
                "customerUsage",
                "dailyInquiryUsage",
                "monthlyWarningUsage",
                "status",
              ].map((key) => (
                <th
                  key={key}
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  {t(`columns.${key}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-8 text-center text-sm text-muted-foreground"
                >
                  {t("emptyState")}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.teamId} className="hover:bg-hover/50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{item.teamName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-foreground">{item.adminName}</p>
                    <p className="text-xs text-muted-foreground">{item.adminEmail}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground capitalize">
                      {item.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-sm",
                      item.isQuizLimited
                        ? "text-red-600 font-medium"
                        : "text-foreground"
                    )}>
                      {item.quizCount} / {item.quizLimit}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-sm",
                      item.isPotentialCustomerLimited
                        ? "text-red-600 font-medium"
                        : "text-foreground"
                    )}>
                      {item.potentialCustomerCount} / {item.potentialCustomerLimit}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({t(`period.${item.potentialCustomerPeriod}`)})
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-sm",
                      item.isDailyInquiryLimited
                        ? "text-red-600 font-medium"
                        : "text-foreground"
                    )}>
                      {item.dailyInquiryCount} / {item.dailyInquiryLimit ?? t("unlimited")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-sm",
                      item.isMonthlyWarningLimited
                        ? "text-red-600 font-medium"
                        : "text-foreground"
                    )}>
                      {item.monthlyWarningCount} / {item.monthlyWarningLimit ?? t("unlimited")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.isQuizLimited ||
                    item.isPotentialCustomerLimited ||
                    item.isDailyInquiryLimited ||
                    item.isMonthlyWarningLimited ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                        {t("limited")}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        {t("normal")}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
