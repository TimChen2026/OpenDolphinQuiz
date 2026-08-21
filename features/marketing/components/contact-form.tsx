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

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslations } from 'next-intl';

import { FormShell } from "@/features/forms/components/form-shell";
import {
  FormTextareaField,
  FormTextField,
} from "@/features/forms/components/form-text-field";
import { ContactInput, contactSchema } from "@/features/marketing/schemas";
import {
  IconBrandGithub,
  IconBrandX,
} from "@tabler/icons-react";

const socials = [
  {
    title: "twitter",
    href: "https://x.com/bourneliu66",
    icon: (
      <IconBrandX className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
    ),
  },
  {
    title: "github",
    href: "https://github.com/Idea-To-Business/dolphinquiz",
    icon: (
      <IconBrandGithub className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
    ),
  },
];

export function ContactForm() {
  const t = useTranslations('contact');
  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      message: "",
    },
  });

  async function onSubmit(values: ContactInput) {
    // TODO: wire up to backend when available
    console.log("submitted form", values);
  }

  return (
    <FormShell<ContactInput>
      form={form}
      title={t('title')}
      description={t('description')}
      onSubmit={onSubmit}
      submitText={t('form.submitButton')}
      className="relative z-20"
      headerSlot={null}
      footer={
        <div className="flex items-center justify-center space-x-4 pt-4">
          {socials.map((social) => (
            <Link
              href={social.href}
              key={social.title}
              className="inline-flex items-center justify-center"
              target="_blank"
              rel="noopener noreferrer"
            >
              {social.icon}
            </Link>
          ))}
        </div>
      }
    >
      <FormTextField
        control={form.control}
        name="name"
        label={t('form.nameLabel')}
        placeholder={t('form.namePlaceholder')}
        autoComplete="name"
      />
      <FormTextField
        control={form.control}
        name="email"
        type="email"
        label={t('form.emailLabel')}
        placeholder={t('form.emailPlaceholder')}
        autoComplete="email"
      />
      <FormTextField
        control={form.control}
        name="company"
        label={t('form.companyLabel')}
        placeholder={t('form.companyPlaceholder')}
        autoComplete="organization"
      />
      <FormTextareaField
        control={form.control}
        name="message"
        label={t('form.messageLabel')}
        placeholder={t('form.messagePlaceholder')}
        rows={5}
      />
    </FormShell>
  );
}
