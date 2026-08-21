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

import { Background } from "@/components/background";
import { Metadata } from "next";
import { HorizontalGradient } from "@/components/horizontal-gradient";
import { ContactForm } from "@/features/marketing/components/contact-form";
import { getTranslations } from 'next-intl/server';
import type { Locale } from "@/i18n.config";
import { generatePageMetadata } from "@/lib/metadata";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: Locale }>
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'contact' });

  return generatePageMetadata({
    locale: params.locale,
    path: '/contact',
    title: t('title'),
    description: t('subtitle'),
  });
}

export default async function ContactPage(
  props: {
    params: Promise<{ locale: Locale }>;
  }
) {
  await props.params;

  return (
    <div className="relative overflow-hidden py-20 md:py-0 px-4 md:px-20 bg-background">
      <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2 relative overflow-hidden">
        <Background />
        <ContactForm />
        <div className="relative w-full z-20 hidden md:flex border-l border-border overflow-hidden bg-background items-center justify-center">
          {/* 右侧品牌展示区：展示 DolphinQuiz 官方 Logo（public/dolphinquiz-logo.jpg） */}
          <div className="max-w-md px-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/dolphinquiz-logo.jpg"
              alt="DolphinQuiz"
              className="w-full h-auto object-contain"
            />
          </div>
          <HorizontalGradient className="top-20" />
          <HorizontalGradient className="bottom-20" />
          <HorizontalGradient className="-right-80 transform rotate-90 inset-y-0 h-full scale-x-150" />
          <HorizontalGradient className="-left-80 transform rotate-90 inset-y-0 h-full scale-x-150" />
        </div>
      </div>
    </div>
  );
}
