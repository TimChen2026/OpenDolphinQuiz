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
import { Logo } from "./Logo";
import { useTranslations } from 'next-intl';
import { LocaleLink } from './locale-link';
import { IconBrandGithub } from '@tabler/icons-react';

const GITHUB_REPO_URL = "https://github.com/TimChen2026/OpenDolphinQuiz";

export const Footer = () => {
  const t = useTranslations();

  const productLinks = [
    { name: t('navigation.footer.product.pricing'), href: "/pricing" },
    { name: t('navigation.footer.product.blog'), href: "/blog" },
    { name: t('navigation.footer.product.contact'), href: "/contact" },
  ];

  const legalLinks = [
    { name: t('navigation.footer.legal.terms'), href: "/terms" },
    { name: t('navigation.footer.legal.privacy'), href: "/privacy" },
    { name: t('navigation.footer.legal.cookies'), href: "/cookies" },
    { name: t('navigation.footer.legal.refund'), href: "/refund" },
  ];

  return (
    <div className="relative">
      <div className="border-t border-border px-8 pt-20 pb-32 relative bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-sm text-muted-foreground flex sm:flex-row flex-col justify-between items-start">
            {/* 左侧：品牌信息 */}
            <div>
              <div className="mr-4 md:flex mb-4">
                <Logo imgClassName="h-16 w-auto object-contain" />
              </div>
              <div>{t('common.brand.copyright')}</div>
              <div className="mt-2">{t('common.brand.allRightsReserved')}</div>
              <div className="mt-6 text-sm text-muted-foreground">
                Support: DolphinQuiz.service@outlook.com
              </div>
            </div>

            {/* 右侧：分类链接 */}
            <div className="grid grid-cols-2 gap-10 items-start mt-10 md:mt-0">
              {/* 产品分类 */}
              <div className="flex flex-col space-y-4 mt-4">
                <h3 className="text-foreground font-semibold text-sm mb-2">
                  {t('navigation.footer.product.title')}
                </h3>
                {productLinks.map((link) => (
                  <LocaleLink
                    key={link.name}
                    className="transition-colors hover:text-foreground text-muted-foreground text-xs sm:text-sm"
                    href={link.href}
                  >
                    {link.name}
                  </LocaleLink>
                ))}
              </div>

              {/* 法律分类 */}
              <div className="flex flex-col space-y-4 mt-4">
                <h3 className="text-foreground font-semibold text-sm mb-2">
                  {t('navigation.footer.legal.title')}
                </h3>
                {legalLinks.map((link) => (
                  <LocaleLink
                    key={link.name}
                    className="transition-colors hover:text-foreground text-muted-foreground text-xs sm:text-sm"
                    href={link.href}
                  >
                    {link.name}
                  </LocaleLink>
                ))}
              </div>
            </div>
          </div>

          {/* 底部：GitHub 链接 */}
          <div className="flex justify-end mt-10">
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <IconBrandGithub className="w-5 h-5" />
              <span className="text-sm">{t('navigation.footer.social.github')}</span>
            </a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-8">
        <p className="text-center text-5xl md:text-9xl lg:text-[13rem] font-normal bg-clip-text text-transparent bg-gradient-to-b from-muted to-border font-display">
          DolphinQuiz
        </p>
      </div>
    </div>
  );
};
