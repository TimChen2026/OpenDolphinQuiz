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

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from 'next-intl';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { signIn } from "@/lib/auth-client";
import Password from "@/components/password";
import { FormShell } from "@/features/forms/components/form-shell";
import { FormTextField } from "@/features/forms/components/form-text-field";
import { SocialAuthButtons } from "@/features/auth/components/social-auth-buttons";
import { LegalConsentLine } from "@/features/auth/components/legal-consent-line";
import { LoginInput, loginSchema } from "@/features/auth/schemas";

interface LoginFormProps {
  showGoogleAuth?: boolean;
}

/**
 * 校验登录前的回跳地址:只允许站内相对路径,
 * 防止 ?callbackURL=https://evil.com 的开放重定向
 */
function sanitizeCallbackURL(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return null;
  }
  return raw;
}

export function LoginForm({ showGoogleAuth = true }: LoginFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('auth.login');
  // 登录前的来源页(如 Quiz 问卷链接),登录成功后跳回该页而非首页
  const callbackURL = sanitizeCallbackURL(
    useSearchParams().get("callbackURL")
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput) {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await signIn.email({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setError(error.message || t('errors.loginFailed'));
        return;
      }

      // 邮箱未验证:跳转到验证引导页,完成验证前不放行进入系统
      if (!data?.user?.emailVerified) {
        router.push(`/${locale}/verify-email-prompt`);
        return;
      }

      // 有来源页(如 Quiz 问卷)则回跳来源页,否则进入首页
      router.push(callbackURL ?? `/${locale}/`);
    } catch {
      setError(t('errors.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setIsLoading(true);
      await signIn.social({
        provider: "google",
        callbackURL: callbackURL ?? "/",
      });
    } catch {
      setError(t('errors.googleLoginFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <FormShell<LoginInput>
      form={form}
      title={t('title')}
      onSubmit={onSubmit}
      submitText={t('signInButton')}
      submitLoadingText={t('signingIn')}
      isLoading={isLoading}
      error={error}
      footer={
        <>
          <LegalConsentLine />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t('noAccount')}{" "}
            <Link href={`/${locale}/signup`} className="text-foreground hover:underline">
              {t('signUpLink')}
            </Link>
          </p>
        </>
      }
      socialSlot={
        showGoogleAuth ? (
          <SocialAuthButtons onGoogleSignIn={handleGoogleSignIn} isLoading={isLoading} />
        ) : undefined
      }
    >
      <FormTextField
        control={form.control}
        name="email"
        type="email"
        label={t('emailLabel')}
        placeholder={t('emailPlaceholder')}
        autoComplete="email"
      />
      <FormTextField
        control={form.control}
        name="password"
        label={t('passwordLabel')}
        placeholder={t('passwordPlaceholder')}
        component={Password}
        autoComplete="current-password"
      />
      <div className="flex items-center justify-between">
        <Link href={`/${locale}/forgot-password`} className="text-sm font-normal text-muted-foreground hover:text-foreground">
          {t('forgotPassword')}
        </Link>
      </div>
    </FormShell>
  );
}
