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

import { useState } from "react";

import { useMotionValueEvent, useScroll, motion, AnimatePresence } from "framer-motion";
import { IoIosClose, IoIosMenu } from "react-icons/io";
import Link from "next/link";
import { ChevronRight, MessageSquare, Image as ImageIcon, Video } from "lucide-react";

import { Button } from "@/components/button";
import { Logo } from "@/components/Logo";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from 'next-intl';
import { cn } from "@/lib/utils";
import { marketingNavigationKeys } from "@/features/navigation/config";

const iconMap = {
  MessageSquare: MessageSquare,
  Image: ImageIcon,
  Video: Video,
};

export const MobileNavbar = () => {
  const [open, setOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const session = useSession();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('navigation.main');
  const tCommon = useTranslations('common.actions');

  const { scrollY } = useScroll();

  const [showBackground, setShowBackground] = useState(false);

  useMotionValueEvent(scrollY, "change", (value) => {
    if (value > 100) {
      setShowBackground(true);
    } else {
      setShowBackground(false);
    }
  });

  return (
    <div
      className={cn(
        "flex justify-between bg-background items-center w-full rounded-full px-4 py-2 transition duration-200",
        showBackground &&
          "bg-secondary shadow-[0px_-2px_0px_0px_hsl(var(--muted)),0px_2px_0px_0px_hsl(var(--muted))]"
      )}
    >
      <Logo variant="text" />
      <IoIosMenu
        className="text-foreground h-6 w-6"
        onClick={() => setOpen(!open)}
      />
      {open && (
        <div className="fixed inset-0 bg-background z-50 flex flex-col items-start justify-start pt-4 text-xl text-muted-foreground transition duration-200">
          <div className="flex items-center justify-between w-full px-5 pb-4 border-b border-border">
            <Logo variant="text" />
            <div className="flex items-center gap-2">
              <ModeToggle />
              <button
                onClick={() => setOpen(!open)}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              >
                <IoIosClose className="h-7 w-7 text-foreground" />
              </button>
            </div>
          </div>
          <div className="flex flex-col items-start justify-start gap-3 px-6 py-6 w-full overflow-y-auto flex-1">
            {marketingNavigationKeys.map((navItem) => (
              <div key={navItem.key} className="w-full">
                {navItem.subItems ? (
                  <>
                    <button
                      onClick={() => {
                        setExpandedItems(prev =>
                          prev.includes(navItem.key)
                            ? prev.filter(item => item !== navItem.key)
                            : [...prev, navItem.key]
                        );
                      }}
                      className="flex items-center justify-between w-full gap-3 group py-2"
                    >
                      <span className="text-xl text-foreground font-semibold">
                        {t(navItem.key)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium px-2 py-0.5 bg-muted rounded-full">
                          {navItem.subItems.length}
                        </span>
                        <ChevronRight
                          className={cn(
                            "w-5 h-5 text-muted-foreground transition-transform duration-200",
                            expandedItems.includes(navItem.key) && "rotate-90"
                          )}
                        />
                      </div>
                    </button>
                    <AnimatePresence>
                      {expandedItems.includes(navItem.key) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="ml-1 mt-2 space-y-0.5 bg-secondary rounded-2xl p-2 border border-border">
                            {navItem.subItems.map((subItem, index) => {
                              const IconComponent = subItem.icon ? iconMap[subItem.icon as keyof typeof iconMap] : null;
                              return (
                                <motion.div
                                  key={subItem.key}
                                  initial={{ x: -8, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ delay: index * 0.04, duration: 0.15 }}
                                >
                                  <Link
                                    href={`/${locale}${subItem.href}`}
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-accent transition-all duration-150 active:scale-[0.98]"
                                  >
                                    {IconComponent && (
                                      <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-muted rounded-lg shadow-sm">
                                        <IconComponent className="w-4.5 h-4.5 text-foreground" />
                                      </div>
                                    )}
                                    <span className="text-[15px] font-medium text-foreground">
                                      {t(subItem.key)}
                                    </span>
                                  </Link>
                                </motion.div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link
                    href={`/${locale}${navItem.href}`}
                    onClick={() => setOpen(false)}
                    target={navItem.target}
                    rel={navItem.target === "_blank" ? "noopener noreferrer" : undefined}
                    className="relative block w-full py-2 hover:opacity-70 transition-opacity"
                  >
                    <span className="block text-xl text-foreground font-semibold">
                      {t(navItem.key)}
                    </span>
                  </Link>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-col w-full items-start gap-4 px-6 py-5 border-t border-border bg-secondary">
            <div className="w-full">
              <LanguageSwitcher />
            </div>
            {session.data?.user ? (
              <>
                <div className="flex flex-col gap-2 w-full">
                  <div className="pb-3 mb-2 border-b border-border">
                    <p className="text-[15px] font-semibold text-foreground">
                      {session.data.user.name || session.data.user.email}
                    </p>
                    {session.data.user.name && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {session.data.user.email}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/${locale}/dashboard`}
                    onClick={() => setOpen(false)}
                    className="text-[15px] font-medium text-muted-foreground py-2 hover:text-foreground transition-colors"
                  >
                    {t('dashboard')}
                  </Link>
                  <Link
                    href={`/${locale}/settings`}
                    onClick={() => setOpen(false)}
                    className="text-[15px] font-medium text-muted-foreground py-2 hover:text-foreground transition-colors"
                  >
                    {t('settings')}
                  </Link>
                  <Link
                    href={`/${locale}/profile`}
                    onClick={() => setOpen(false)}
                    className="text-[15px] font-medium text-muted-foreground py-2 hover:text-foreground transition-colors"
                  >
                    {t('profile')}
                  </Link>
                  <button
                    onClick={async () => {
                      await signOut();
                      setOpen(false);
                      router.push("/");
                      router.refresh();
                    }}
                    className="text-[15px] font-medium text-destructive py-2 text-left hover:opacity-80 transition-opacity"
                  >
                    {tCommon('signOut')}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2.5 w-full">
                <Button
                  as={Link}
                  href={`/${locale}/signup`}
                  onClick={() => setOpen(false)}
                  className="w-full justify-center"
                >
                  {tCommon('signUp')}
                </Button>
                <Button
                  variant="simple"
                  as={Link}
                  href={`/${locale}/login`}
                  onClick={() => setOpen(false)}
                  className="w-full justify-center"
                >
                  {tCommon('signIn')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
