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

import { useEffect, useState } from "react";

import { Button } from "./button";
import { HiArrowRight } from "react-icons/hi2";
import { Badge } from "./badge";
import { AnimatePresence, motion } from "framer-motion";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LocaleLink } from "@/components/locale-link";
import { useTranslations, useLocale } from 'next-intl';

const COURSE_COMMUNITY_URL = " ";

export const Hero = () => {
  const router = useRouter();
  const t = useTranslations('hero');
  const locale = useLocale();
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  useEffect(() => {
    if (!isCodeModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCodeModalOpen(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCodeModalOpen]);

  return (
    <div className="flex flex-col min-h-screen pt-20 md:pt-40 relative overflow-hidden">
      <motion.div
        initial={{
          y: 40,
          opacity: 0,
        }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        transition={{
          ease: "easeOut",
          duration: 0.5,
        }}
        className="flex justify-center"
      >
        <Badge onClick={() => router.push(`/${locale}/blog/from-burning-cash-to-data-driven-conversion`)}>
          {t('badge')}
        </Badge>
      </motion.div>
      <motion.h1
        initial={{
          y: 40,
          opacity: 0,
        }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        transition={{
          ease: "easeOut",
          duration: 0.5,
        }}
        className="text-2xl md:text-4xl lg:text-8xl font-semibold max-w-6xl mx-auto text-center mt-6 relative z-10"
      >
        {t('title')}
      </motion.h1>
      <motion.h2
        initial={{
          y: 40,
          opacity: 0,
        }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        transition={{
          ease: "easeOut",
          duration: 0.5,
          delay: 0.2,
        }}
        className="text-center mt-6 text-base md:text-xl text-muted-foreground max-w-3xl mx-auto relative z-10 font-normal"
      >
        {t('description')}
      </motion.h2>
      <motion.div
        initial={{
          y: 80,
          opacity: 0,
        }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        transition={{
          ease: "easeOut",
          duration: 0.5,
          delay: 0.4,
        }}
        className="flex items-center gap-4 justify-center mt-6 relative z-10"
      >
        <Button
          as={LocaleLink}
          href="/docs"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('cta.primary')}
        </Button>
        <Button
          variant="simple"
          type="button"
          onClick={() => setIsCodeModalOpen(true)}
          className="flex space-x-2 items-center group"
        >
          <span>{t('cta.secondary')}</span>
          <HiArrowRight className="text-muted-foreground group-hover:translate-x-1 stroke-[1px] h-3 w-3 transition-transform duration-200" />
        </Button>
      </motion.div>
      <AnimatePresence>
        {isCodeModalOpen && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCodeModalOpen(false)}
          >
            <div className="absolute inset-0 bg-background/70 backdrop-blur-md" />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="hero-code-modal-title"
              aria-describedby="hero-code-modal-description"
              className="relative w-full max-w-xl overflow-hidden rounded-[28px] border border-border bg-background shadow-2xl"
              initial={{ y: 24, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent_55%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_55%)]" />
              <div className="relative p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                    {t("modal.eyebrow")}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCodeModalOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                    aria-label={t("modal.close")}
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>

                <h3
                  id="hero-code-modal-title"
                  className="mt-6 max-w-lg text-2xl font-semibold text-foreground sm:text-3xl"
                >
                  {t("modal.title")}
                </h3>
                <p
                  id="hero-code-modal-description"
                  className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base"
                >
                  {t("modal.description")}
                </p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                  {t("modal.instruction")}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    as="a"
                    href={COURSE_COMMUNITY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <span>{t("modal.linkLabel")}</span>
                    <HiArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </Button>
                  <Button
                    variant="simple"
                    type="button"
                    onClick={() => setIsCodeModalOpen(false)}
                  >
                    {t("modal.close")}
                  </Button>
                </div>

                <a
                  href={COURSE_COMMUNITY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex break-all text-sm text-muted-foreground underline decoration-border underline-offset-4 transition hover:text-foreground"
                >
                  {t("modal.linkHint")}
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="p-4 border border-border bg-secondary rounded-[32px] mt-20 relative overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-40 w-full bg-gradient-to-b from-transparent via-background to-background scale-[1.1] pointer-events-none" />
        <div className="p-2 bg-background border border-border rounded-[24px]">
          <Image
            src="/starter/sample.png"
            alt="Product interface preview"
            width={1920}
            height={1080}
            className="rounded-[20px] dark:hidden"
            priority
          />
          <Image
            src="/starter/sampledark.png"
            alt="Product interface preview in dark mode"
            width={1920}
            height={1080}
            className="rounded-[20px] hidden dark:block"
            priority
          />
        </div>
      </div>
    </div>
  );
};
