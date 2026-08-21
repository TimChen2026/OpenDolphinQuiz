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

import React from "react";
import { useTranslations } from "next-intl";

// 套餐 ID 列表
// 需求文档 1.5：免费版、Pro版、Max版，具体内容 MVP 阶段后敲定
const TIER_IDS = ["free", "pro", "max"] as const;

export function PricingTable() {
  const t = useTranslations("pricing");

  const tableRows: Array<{
    title: string;
    values: Record<string, string>;
  }> = [
    {
      title: t("comparison.rows.purchaseType"),
      values: {
        free: t("comparison.values.subscription"),
        pro: t("comparison.values.subscription"),
        max: t("comparison.values.subscription"),
      },
    },
    {
      title: t("comparison.rows.monthlyPrice"),
      values: {
        free: t("comparison.values.tba"),
        pro: t("comparison.values.tba"),
        max: t("comparison.values.tba"),
      },
    },
    {
      title: t("comparison.rows.bestFor"),
      values: {
        free: t("comparison.values.bestForFree"),
        pro: t("comparison.values.bestForPro"),
        max: t("comparison.values.bestForMax"),
      },
    },
  ];

  return (
    <div className="relative z-20 mx-auto w-full px-4 py-40">
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="max-w-xs py-3.5 pl-4 pr-3 text-left text-3xl font-extrabold text-foreground sm:pl-0" />
                  {TIER_IDS.map((tierId) => (
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-center text-lg font-semibold text-foreground"
                      key={tierId}
                    >
                      {t(`tiers.${tierId}.name`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tableRows.map((row) => (
                  <tr key={row.title}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-0">
                      {row.title}
                    </td>
                    {TIER_IDS.map((tierId) => (
                      <td
                        key={`${row.title}-${tierId}`}
                        className="whitespace-nowrap px-3 py-4 text-center text-sm text-muted-foreground"
                      >
                        {row.values[tierId]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
