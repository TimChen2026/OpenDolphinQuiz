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

import { Container } from "@/components/container";
import { Background } from "@/components/background";
import { Heading } from "@/components/heading";
import { Subheading } from "@/components/subheading";
import { Pricing } from "@/components/pricing";
import { Metadata } from "next";
import { getTranslations } from 'next-intl/server';
import type { Locale } from "@/i18n.config";
import { generatePageMetadata } from "@/lib/metadata";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: Locale }>
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.locale, namespace: 'pricing' });

  return generatePageMetadata({
    locale: params.locale,
    path: '/pricing',
    title: t('title'),
    description: t('subtitle'),
  });
}

export default async function PricingPage(
  props: {
    params: Promise<{ locale: Locale }>;
  }
) {
  const params = await props.params;

  const {
    locale
  } = params;

  const t = await getTranslations({ locale, namespace: 'pricing' });

  return (
    <div className="relative overflow-hidden py-20 md:py-0">
      <Background />
      <Container className="flex flex-col items-center justify-between  pb-20">
        <div className="relative z-20 py-10 md:pt-40">
          <Heading as="h1">{t('title')}</Heading>
          <Subheading className="text-center">
            {t('description')}
          </Subheading>
        </div>
        <Pricing />
      </Container>
    </div>
  );
}
