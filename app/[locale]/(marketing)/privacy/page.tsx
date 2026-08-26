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
import { privacyZhContent } from "@/components/legal/content/privacy-zh";
import { privacyEnContent } from "@/components/legal/content/privacy-en";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: Locale }>
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'seo' });

  return {
    title: t('privacy.title'),
    description: t('privacy.description'),
    openGraph: {
      images: [t('privacy.ogImage')],
    },
  };
}

export default async function PrivacyPage(
  props: {
    params: Promise<{ locale: Locale }>
  }
) {
  const params = await props.params;
  // 中英文内容分别来自协议文件夹中的正式文本,与 docx 保持一致
  const content = params.locale === 'zh' ? privacyZhContent : privacyEnContent;

  return <LegalDocument content={content} />;
}
