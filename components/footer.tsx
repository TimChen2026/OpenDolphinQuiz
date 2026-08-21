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

export const Footer = () => {
  const t = useTranslations();
  
  const links = [
    {
      name: t('navigation.main.pricing'),
      href: "/pricing",
    },
    {
      name: t('navigation.main.blog'),
      href: "/blog",
    },
    {
      name: t('navigation.main.contact'),
      href: "/contact",
    },
  ];
  const legal = [
    {
      name: t('navigation.footer.legal.terms'),
      href: "/terms",
    },
    {
      name: t('navigation.footer.legal.privacy'),
      href: "/privacy",
    },
    {
      name: t('navigation.footer.legal.cookies'),
      href: "/cookies",
    },
    {
      name: t('navigation.footer.legal.refund'),
      href: "/refund",
    },
  ];
  return (
    <div className="relative">
      <div className="border-t border-border px-8 pt-20 pb-32 relative bg-background">
        <div className="max-w-7xl mx-auto">
          {/* Footer Links Section */}
          <div className="text-sm text-muted-foreground flex sm:flex-row flex-col justify-between items-start">
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
            <div className="grid grid-cols-2 gap-10 items-start mt-10 md:mt-0">
              <div className="flex justify-center space-y-4 flex-col mt-4">
                {links.map((link) => (
                  <LocaleLink
                    key={link.name}
                    className="transition-colors hover:text-foreground text-muted-foreground text-xs sm:text-sm"
                    href={link.href}
                  >
                    {link.name}
                  </LocaleLink>
                ))}
              </div>
              <div className="flex justify-center space-y-4 flex-col mt-4">
                {legal.map((link) => (
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
