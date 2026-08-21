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
import { Button } from "./button";
import { useTranslations } from 'next-intl';

export const CTA = () => {
  const t = useTranslations('cta');
  return (
    <section className="py-60 w-full  overflow-hidden relative z-30">
      <div className="bg-background">
        <div className="mx-auto w-full relative z-20 sm:max-w-[40rem]  md:max-w-[48rem] lg:max-w-[64rem] xl:max-w-[80rem] bg-gradient-to-br from-slate-800 to-gray-900 dark:from-neutral-900 dark:to-neutral-950 sm:rounded-2xl">
          <div className="relative -mx-6   sm:mx-0 sm:rounded-2xl overflow-hidden px-6  md:px-8 ">
            <div
              className="absolute inset-0 w-full h-full opacity-10 bg-noise fade-vignette [mask-image:radial-gradient(#fff,transparent,75%)]"
              style={{
                backgroundImage: "url(/noise.webp)",
                backgroundSize: "30%",
              }}
            ></div>
            <div
              className="pointer-events-none absolute inset-y-0 right-0 select-none overflow-hidden rounded-2xl"
              style={{
                mask: "radial-gradient(33.875rem 33.875rem at calc(100% - 8.9375rem) 0, white 3%, transparent 70%)",
              }}
            ></div>

            <div className="relative px-6 pb-14 pt-20 sm:px-10 sm:pb-20 lg:px-[4.5rem]">
              <h2 className="text-center text-balance mx-auto text-3xl md:text-5xl font-semibold tracking-[-0.015em] text-white">
                {t('title')}
              </h2>
              <p className="mt-4 max-w-[26rem] text-center mx-auto text-base/6 text-white/80">
                {t('description')}
              </p>

              <div className="relative z-10 mx-auto flex justify-center mt-6">
                <Button as="a" href="https://dolphinquiz.vercel.app" target="_blank" rel="noopener noreferrer">{t('button')}</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
