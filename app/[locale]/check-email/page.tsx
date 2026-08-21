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

'use client';

import { Mail, ArrowRight, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

export default function CheckEmailPage() {
  const locale = useLocale();
  const t = useTranslations('auth.checkEmail');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleResendEmail = async () => {
    try {
      setIsResending(true);
      setResendMessage('');
      
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        setResendMessage(t('resendSuccess'));
      } else {
        const data = await response.json();
        setResendMessage(data.error || t('resendError'));
      }
    } catch {
      setResendMessage(t('resendError'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
          <div className="text-center">
            {/* Email Icon with Animation */}
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-muted-foreground/20 rounded-full opacity-20 animate-ping"></div>
              <Mail className="w-20 h-20 mx-auto mb-6 text-card-foreground relative" />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-card-foreground mb-3">
              {t('title')}
            </h1>

            {/* Description */}
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {t('description')}
            </p>

            {/* Email Illustration */}
            <div className="bg-muted rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-2">
                {t('notReceived')}
              </p>
              <ul className="text-left text-sm text-card-foreground space-y-2">
                <li className="flex items-start">
                  <ArrowRight className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <span>{t('checkSpam')}</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <span>{t('checkEmailCorrect')}</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <span>{t('waitAndCheck')}</span>
                </li>
              </ul>
            </div>

            {/* Resend Button */}
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full mb-4 px-6 py-3 bg-foreground hover:bg-foreground/90 disabled:bg-muted-foreground text-background font-medium rounded-lg transition-colors flex items-center justify-center"
            >
              {isResending ? (
                <>
                  <RefreshCcw className="w-5 h-5 mr-2 animate-spin" />
                  {t('resending')}
                </>
              ) : (
                <>
                  <RefreshCcw className="w-5 h-5 mr-2" />
                  {t('resendButton')}
                </>
              )}
            </button>

            {/* Resend Message */}
            {resendMessage && (
              <p className={`text-sm mb-4 ${
                resendMessage.includes('successfully')
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {resendMessage}
              </p>
            )}

            {/* Back to Login */}
            <Link
              href={`/${locale}/login`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('backToLogin')}
            </Link>
          </div>

          {/* Security Note */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              {t('securityNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
