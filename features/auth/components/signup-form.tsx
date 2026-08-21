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
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from 'next-intl';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { signIn, signUp } from "@/lib/auth-client";
import Password from "@/components/password";
import { FormShell } from "@/features/forms/components/form-shell";
import { FormTextField } from "@/features/forms/components/form-text-field";
import { SocialAuthButtons } from "@/features/auth/components/social-auth-buttons";
import { TurnstileWidget } from "@/features/auth/components/turnstile";
import { SignupInput, signupSchema } from "@/features/auth/schemas";

interface SignupFormProps {
  showGoogleAuth?: boolean;
}

export function SignupForm({ showGoogleAuth = true }: SignupFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('auth.signup');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      turnstileToken: "",
    },
  });

  async function onSubmit(values: SignupInput) {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Better Auth创建用户
      const { error } = await signUp.email({
        email: values.email,
        password: values.password,
        name: values.name,
      });

      if (error) {
        setError(error.message || t('errors.signupFailed'));
        return;
      }

      // 2. 调用增强端点:加密phone + 验证Turnstile + 发放通行证
      try {
        const enhanceResponse = await fetch('/api/auth/signup-enhanced', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            phone: values.phone,
            turnstileToken: values.turnstileToken,
          }),
        });

        if (!enhanceResponse.ok) {
          const enhanceData = await enhanceResponse.json().catch(() => ({}));
          console.error('注册增强失败:', enhanceData.error || enhanceResponse.status);
          // 不阻塞流程,用户已创建,phone和通行证可在后续补充
        }
      } catch (enhanceError) {
        console.error('注册增强请求异常:', enhanceError);
        // 不阻塞流程,用户已创建
      }

      // 3. 发送验证邮件(保持原有逻辑)
      try {
        const verificationResponse = await fetch('/api/auth/resend-verification', {
          method: 'POST',
          credentials: 'include',
        });
        if (!verificationResponse.ok) {
          console.error('发送验证邮件失败: 接口返回非 200 状态');
        }
      } catch (verificationError) {
        console.error('发送验证邮件失败:', verificationError);
      }

      // 跳转到邮箱验证提示页面
      router.push(`/${locale}/check-email`);
    } catch {
      setError(t('errors.signupFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setIsLoading(true);
      await signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch {
      setError(t('errors.googleSignupFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <FormShell<SignupInput>
      form={form}
      title={t('title')}
      onSubmit={onSubmit}
      submitText={t('signUpButton')}
      submitLoadingText={t('signingUp')}
      isLoading={isLoading}
      error={error}
      footer={
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t('hasAccount')}{" "}
          <Link href={`/${locale}/login`} className="text-foreground hover:underline">
            {t('signInLink')}
          </Link>
        </p>
      }
      socialSlot={
        showGoogleAuth ? (
          <SocialAuthButtons onGoogleSignIn={handleGoogleSignIn} isLoading={isLoading} />
        ) : undefined
      }
    >
      <FormTextField
        control={form.control}
        name="name"
        label={t('nameLabel')}
        placeholder={t('namePlaceholder')}
        autoComplete="name"
      />
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
        autoComplete="new-password"
      />
      <FormTextField
        control={form.control}
        name="phone"
        label={t('phoneLabel')}
        placeholder={t('phonePlaceholder')}
        autoComplete="tel"
      />
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('turnstileLabel')}</label>
        <TurnstileWidget
          onVerify={(token) => form.setValue("turnstileToken", token, { shouldValidate: false })}
          onExpire={() => form.setValue("turnstileToken", "", { shouldValidate: false })}
          onError={() => form.setValue("turnstileToken", "", { shouldValidate: false })}
        />
      </div>
    </FormShell>
  );
}
