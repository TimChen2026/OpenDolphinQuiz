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
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";

import { signIn, signUp } from "@/lib/auth-client";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/button";
import Password from "@/components/password";
import { FormTextField } from "@/features/forms/components/form-text-field";
import { SocialAuthButtons } from "@/features/auth/components/social-auth-buttons";
import { TurnstileWidget } from "@/features/auth/components/turnstile";
import { SignupInput, signupSchema } from "@/features/auth/schemas";

type QuizRegisterCardProps = {
  /** 注册成功后回调,父组件据此进入 Quiz 流程 */
  onRegistered: () => void;
};

/**
 * Quiz 前置注册卡片
 *
 * 与独立注册页(SignupForm)的差异:
 * - 卡片式样式,内嵌于 Quiz 页面,无独立布局
 * - 注册成功后不跳转到 /check-email,改为调用 onRegistered 回调进入 Quiz 流程
 * - 验证邮件异步发送,不打断 Quiz 体验
 * - Google 登录的 callbackURL 指向 /quiz,登录后自动返回 Quiz 页
 *
 * 复用SignupForm的核心逻辑:zod 校验、Better Auth signUp、Turnstile 人机验证、增强端点
 */
export function QuizRegisterCard({ onRegistered }: QuizRegisterCardProps) {
  const locale = useLocale();
  const t = useTranslations("quiz.register");
  const tSocial = useTranslations("auth.social");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

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

      // 1. Better Auth 创建用户
      const { error: signUpError } = await signUp.email({
        email: values.email,
        password: values.password,
        name: values.name,
      });

      if (signUpError) {
        setError(signUpError.message || t("errors.signupFailed"));
        return;
      }

      // 2. 调用增强端点:加密 phone + 验证 Turnstile + 发放通行证
      // 不阻塞主流程,即使增强失败用户也已创建,可在后续补充
      try {
        const enhanceResponse = await fetch("/api/auth/signup-enhanced", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            phone: values.phone,
            turnstileToken: values.turnstileToken,
          }),
        });

        if (!enhanceResponse.ok) {
          const enhanceData = await enhanceResponse.json().catch(() => ({}));
          console.error("注册增强失败:", enhanceData.error || enhanceResponse.status);
        }
      } catch (enhanceError) {
        console.error("注册增强请求异常:", enhanceError);
      }

      // 3. 异步发送验证邮件,不等待结果
      fetch("/api/auth/resend-verification", {
        method: "POST",
        credentials: "include",
      }).catch((verificationError) => {
        console.error("发送验证邮件失败:", verificationError);
      });

      // 4. 显示注册成功提示,短暂延迟后进入 Quiz 流程
      setIsSuccess(true);
      setTimeout(() => {
        onRegistered();
      }, 1200);
    } catch {
      setError(t("errors.signupFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setIsLoading(true);
      // Google 登录回调指向 Quiz 页,登录后自动返回
      await signIn.social({
        provider: "google",
        callbackURL: `/${locale}/quiz`,
      });
    } catch {
      setError(t("errors.googleSignupFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  // 注册成功后的过渡界面
  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md mx-auto px-4 py-12 text-center"
      >
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10">
          <svg
            className="w-8 h-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
          {t("successTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("successDescription")}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-border bg-background p-6 sm:p-8 shadow-sm"
      >
        {/* 标题区 */}
        <div className="mb-6 text-center">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormTextField
              control={form.control}
              name="name"
              label={t("nameLabel")}
              placeholder={t("namePlaceholder")}
              autoComplete="name"
            />
            <FormTextField
              control={form.control}
              name="email"
              type="email"
              label={t("emailLabel")}
              placeholder={t("emailPlaceholder")}
              autoComplete="email"
            />
            <FormTextField
              control={form.control}
              name="password"
              label={t("passwordLabel")}
              placeholder={t("passwordPlaceholder")}
              component={Password}
              autoComplete="new-password"
            />
            <FormTextField
              control={form.control}
              name="phone"
              label={t("phoneLabel")}
              placeholder={t("phonePlaceholder")}
              autoComplete="tel"
            />
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t("turnstileLabel")}
              </label>
              <TurnstileWidget
                onVerify={(token) =>
                  form.setValue("turnstileToken", token, { shouldValidate: false })
                }
                onExpire={() =>
                  form.setValue("turnstileToken", "", { shouldValidate: false })
                }
                onError={() =>
                  form.setValue("turnstileToken", "", { shouldValidate: false })
                }
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? t("signingUp") : t("signUpButton")}
            </Button>
          </form>
        </Form>

        {/* 分隔线 */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm font-medium leading-6">
            <span className="bg-background px-6 text-muted-foreground">
              {tSocial("or")}
            </span>
          </div>
        </div>

        {/* Google 登录 */}
        <SocialAuthButtons
          onGoogleSignIn={handleGoogleSignIn}
          isLoading={isLoading}
        />

        {/* 已有账户?登录 */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link
            href={`/${locale}/login`}
            className="text-foreground hover:underline"
          >
            {t("signInLink")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
