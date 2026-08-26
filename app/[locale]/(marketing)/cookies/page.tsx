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

import { Metadata } from "next";
import { getTranslations } from 'next-intl/server';
import type { Locale } from "@/i18n.config";
import { LegalDocument } from "@/components/legal/legal-document";
import { cookiesZhContent } from "@/components/legal/content/cookies-zh";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: Locale }>
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'seo' });

  return {
    title: t('cookies.title'),
    description: t('cookies.description'),
    openGraph: {
      images: [t('cookies.ogImage')],
    },
  };
}

export default async function CookiesPage() {
  // 中文版依据定稿《隐私政策》第 4 条编写;
  // 英文版待用户确认中文版后再输出,在此之前各语言暂时展示中文版
  return <LegalDocument content={cookiesZhContent} />;
}
