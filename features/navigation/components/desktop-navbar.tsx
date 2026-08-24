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

import { useState, useEffect } from "react";

import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import { useTranslations } from "next-intl";

import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { marketingNavigationKeys } from "@/features/navigation/config";
import { useSession } from "@/lib/auth-client";

import { NavBarItem } from "./navbar-item";
import { NavBarItemWithDropdown } from "./navbar-item-with-dropdown";
import {
  UserMenu,
} from "./user-menu";
import { UpgradeDialog } from "./upgrade-dialog";

export const DesktopNavbar = () => {
  const t = useTranslations('navigation.main');
  const { scrollY } = useScroll();
  const session = useSession();
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  // 账号类型:customer = 客户(Guest),点击"仪表盘"时触发升级而非跳转
  const [accountType, setAccountType] = useState<string | null>(null);

  const [showBackground, setShowBackground] = useState(false);

  useMotionValueEvent(scrollY, "change", (value) => {
    if (value > 100) {
      setShowBackground(true);
    } else {
      setShowBackground(false);
    }
  });

  // 已登录时获取账号类型(客户需拦截"仪表盘"跳转为升级引导)
  useEffect(() => {
    if (!session.data?.user?.id) {
      return;
    }
    let cancelled = false;
    fetch("/api/user/profile")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => {
        if (!cancelled) {
          setAccountType(data.user?.accountType ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAccountType(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [session.data?.user?.id]);

  const isCustomer = session.data?.user && accountType === "customer";
  // 客户点击"仪表盘":弹出升级对话框,而非跳转到仪表盘(避免被重定向到问卷)
  const handleDashboardClick = () => {
    if (isCustomer) {
      setIsUpgradeOpen(true);
    }
  };
  return (
    <div
      className={cn(
        "w-full flex relative justify-between px-4 py-2 rounded-full bg-transparent transition duration-200",
        showBackground &&
          "bg-secondary shadow-[0px_-2px_0px_0px_hsl(var(--muted)),0px_2px_0px_0px_hsl(var(--muted))]"
      )}
    >
      <AnimatePresence>
        {showBackground && (
          <motion.div
            key={String(showBackground)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 1,
            }}
            className="absolute inset-0 h-full w-full bg-muted pointer-events-none [mask-image:linear-gradient(to_bottom,white,transparent,white)] rounded-full"
          />
        )}
      </AnimatePresence>
      <div className="flex flex-row gap-2 items-center">
        <Logo variant="text" />
        <div className="flex items-center gap-1.5">
          {marketingNavigationKeys.map((item) => (
            item.subItems ? (
              <NavBarItemWithDropdown 
                key={item.key}
                href={item.href}
                target={item.target}
                subItems={item.subItems}
              >
                {t(item.key)}
              </NavBarItemWithDropdown>
            ) : (
              <NavBarItem
                href={item.href}
                key={item.key}
                target={item.target}
                onClick={item.key === "dashboard" && isCustomer ? handleDashboardClick : undefined}
              >
                {t(item.key)}
              </NavBarItem>
            )
          ))}
        </div>
      </div>
      <div className="flex space-x-2 items-center">
        <LanguageSwitcher />
        <ModeToggle />
        <UserMenu />
      </div>

      {/* 客户点击"仪表盘"触发的升级对话框 */}
      <UpgradeDialog
        open={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
      />
    </div>
  );
};
