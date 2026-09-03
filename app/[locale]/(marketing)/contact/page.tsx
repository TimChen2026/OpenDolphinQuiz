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
import { getTranslations } from 'next-intl/server';
import type { Locale } from "@/i18n.config";
import { generatePageMetadata } from "@/lib/metadata";

// 单个联系渠道:label 为分类名,links 为该渠道下的联系方式链接
type ContactChannel = {
  label: string;
  links: {
    text: string;
    href: string;
    // 外部链接(社区/开源仓库)需在新标签页打开
    external?: boolean;
  }[];
};

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
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'contact' });

  // 四类联系渠道(链接为静态展示,不随语言变化)
  const contactChannels: ContactChannel[] = [
    {
      label: t('info.customerServiceLabel'),
      links: [{ text: "Anna@dolphinquiz.com", href: "mailto:Anna@dolphinquiz.com" }],
    },
    {
      label: t('info.technicalSupportLabel'),
      links: [
        { text: "tim.chen@dolphinquiz.com", href: "mailto:tim.chen@dolphinquiz.com" },
        { text: "huiting.chen@outlook.com", href: "mailto:huiting.chen@outlook.com" },
      ],
    },
    {
      label: t('info.communityLabel'),
      links: [
        {
          text: "dolphinquiz.discourse.group",
          href: "https://dolphinquiz.discourse.group",
          external: true,
        },
      ],
    },
    {
      label: t('info.openSourceLabel'),
      links: [
        {
          text: "github.com/TimChen2026/OpenDolphinQuiz",
          href: "https://github.com/TimChen2026/OpenDolphinQuiz",
          external: true,
        },
      ],
    },
  ];

  return (
    <div className="relative overflow-hidden py-20 md:py-0 px-4 md:px-20 bg-background">
      <div className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2 relative overflow-hidden">
        <Background />
        <div className="relative w-full z-20 flex items-center justify-center py-16 md:py-0">
          {/* 联系渠道信息区:替代原联系表单,风格与站点主体一致 */}
          <div className="max-w-xl w-full px-6 md:px-12 flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-bold font-display text-primary">
                {t('title')}
              </h1>
              <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
            </div>
            {contactChannels.map((channel) => (
              <div
                key={channel.label}
                className="rounded-2xl border border-border bg-background/80 p-5"
              >
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {channel.label}
                </p>
                <div className="mt-2 flex flex-col gap-1">
                  {channel.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-sm font-medium break-all transition-colors text-foreground hover:text-primary"
                    >
                      {link.text}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
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
