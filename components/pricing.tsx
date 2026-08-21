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

import { IconCircleCheckFilled } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/utils";

// 套餐 ID 列表（需求文档 1.5：免费版、Pro 版、Max 版）
const TIER_IDS = ["free", "pro", "max"] as const;

// 月付价格（美元）；免费版用翻译文案，价格不参与周期换算
const MONTHLY_PRICE: Record<string, number> = {
  free: 0,
  pro: 10,
  max: 20,
};

// 年付享 30% 优惠（折算到月单价）
const YEARLY_DISCOUNT = 0.3;

const BILLING_PERIODS = ["monthly", "yearly"] as const;
type BillingPeriod = (typeof BILLING_PERIODS)[number];

export function Pricing() {
  const t = useTranslations("pricing");
  const [billing, setBilling] = useState<BillingPeriod>("monthly");

  return (
    <div className="relative z-20 mx-auto mt-4">
      {/* 月付 / 年付切换：选择年付享 30% 优惠（参考 fast3d.io/pricing 交互） */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center rounded-full bg-muted p-1">
          {BILLING_PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setBilling(period)}
              className={cn(
                "px-5 py-2 text-sm font-semibold rounded-full transition-colors",
                billing === period
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {period === "monthly" ? "Monthly" : "Yearly −30%"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TIER_IDS.map((tierId, index) => {
          // Pro 版作为推荐套餐高亮显示
          const featured = tierId === "pro";
          const price = MONTHLY_PRICE[tierId];
          const isFree = tierId === "free";
          const isYearly = billing === "yearly";
          // 年付单价 = 月付单价 × (1 - 30%)，四舍五入为整数
          const discountedPrice = Math.round(price * (1 - YEARLY_DISCOUNT));

          const priceMotion = {
            initial: { x: -20, opacity: 0 },
            animate: { x: 0, opacity: 1 },
            transition: { duration: 0.2, ease: "easeOut" as const, delay: index * 0.1 },
          };

          return (
            <div
              key={tierId}
              className={cn(
                featured ? "relative bg-primary shadow-2xl" : "bg-card",
                "flex h-full flex-col justify-between rounded-lg px-6 py-8 sm:mx-8 lg:mx-0"
              )}
            >
              <div>
                <h3
                  className={cn(
                    featured ? "text-primary-foreground" : "text-muted-foreground",
                    "text-base font-semibold leading-7"
                  )}
                >
                  {t(`tiers.${tierId}.name`)}
                </h3>
                <p className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  {isFree ? (
                    <motion.span
                      key={billing}
                      {...priceMotion}
                      className={cn(
                        "inline-block text-4xl font-bold tracking-tight",
                        featured ? "text-primary-foreground" : "text-foreground"
                      )}
                    >
                      {t(`tiers.${tierId}.price`)}
                    </motion.span>
                  ) : (
                    <>
                      {isYearly && (
                        <motion.span
                          key="original"
                          {...priceMotion}
                          className={cn(
                            "text-xl font-semibold line-through",
                            featured
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          )}
                        >
                          {`$${price} / month`}
                        </motion.span>
                      )}
                      <motion.span
                        key={billing}
                        {...priceMotion}
                        className={cn(
                          "inline-block text-4xl font-bold tracking-tight",
                          featured ? "text-primary-foreground" : "text-foreground"
                        )}
                      >
                        {`$${isYearly ? discountedPrice : price} / month`}
                      </motion.span>
                    </>
                  )}
                </p>
                <p
                  className={cn(
                    featured ? "text-primary-foreground/80" : "text-muted-foreground",
                    "mt-6 min-h-12 text-sm leading-7"
                  )}
                >
                  {t(`tiers.${tierId}.description`)}
                </p>
                <ul
                  role="list"
                  className={cn(
                    featured ? "text-primary-foreground/80" : "text-muted-foreground",
                    "mt-8 space-y-3 text-sm leading-6 sm:mt-10"
                  )}
                >
                  {(t.raw(`tiers.${tierId}.features`) as string[]).map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <IconCircleCheckFilled
                        className={cn(
                          featured ? "text-primary-foreground" : "text-muted-foreground",
                          "h-6 w-5 flex-none"
                        )}
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              {/* 支付功能后续使用 Waffo Pancake 实现，MVP 阶段暂不提供购买按钮 */}
              <div
                className={cn(
                  "mt-8 block w-full rounded-full px-3.5 py-2.5 text-center text-sm font-semibold sm:mt-10",
                  featured
                    ? "bg-background text-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {t(`tiers.${tierId}.cta`)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}