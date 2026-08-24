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
import { useLocale, useTranslations } from 'next-intl';
import { Mail, AlertCircle } from 'lucide-react';

type EmailVerificationPromptProps = {
  /** 当前登录用户的邮箱(用于展示验证目标) */
  email: string;
};

/**
 * 邮箱未验证引导(提示用户完成邮箱验证)
 *
 * 展示待验证邮箱并支持重新发送验证邮件。
 * 供登录后跳转的独立验证页与 EmailVerifiedGuard(受保护页面兜底拦截)共用。
 */
export function EmailVerificationPrompt({ email }: EmailVerificationPromptProps) {
  const locale = useLocale();
  const t = useTranslations('auth.emailVerifiedGuard');
  const [isResending, setIsResending] = React.useState(false);
  const [resendMessage, setResendMessage] = React.useState('');
  const [resendSuccess, setResendSuccess] = React.useState(false);

  const handleResendEmail = async () => {
    try {
      setIsResending(true);
      setResendMessage('');

      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setResendSuccess(true);
        setResendMessage(t('resendSuccess'));
      } else {
        setResendSuccess(false);
        setResendMessage(t('resendError'));
      }
    } catch {
      setResendSuccess(false);
      setResendMessage(t('resendError'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="bg-card text-card-foreground rounded-xl shadow-lg p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500/10 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">
              {t('title')}
            </h2>

            <p className="text-muted-foreground mb-6">
              {t('description')}
            </p>

            <div className="bg-muted rounded-lg px-4 py-2 mb-6">
              <p className="font-medium text-foreground">
                {email}
              </p>
            </div>

            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-medium rounded-lg transition-colors flex items-center justify-center"
            >
              {isResending ? (
                <>
                  <Mail className="w-5 h-5 mr-2 animate-pulse" />
                  {t('resending')}
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 mr-2" />
                  {t('resendButton')}
                </>
              )}
            </button>

            {resendMessage && (
              <p className={`text-sm mt-4 ${
                resendSuccess ? 'text-green-600' : 'text-red-600'
              }`}>
                {resendMessage}
              </p>
            )}

            <div className="mt-6 pt-6 border-t border-border">
              <button
                onClick={() => {
                  // Sign out and redirect to login
                  window.location.href = `/${locale}/login`;
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t('signOutLink')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
