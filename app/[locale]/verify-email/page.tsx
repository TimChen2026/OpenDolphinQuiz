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

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('auth.verifyEmail');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. Please check your email for the correct link.');
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Your email has been successfully verified! Redirecting to login...');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push(`/${locale}/login`);
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. The link may have expired.');
        }
      } catch {
        setStatus('error');
        setMessage('An error occurred while verifying your email. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams, router, locale]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-muted to-background">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
          {status === 'loading' && (
            <div className="text-center">
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
              <h1 className="text-2xl font-bold text-card-foreground mb-2">
                {t('verifying')}
              </h1>
              <p className="text-muted-foreground">
                {t('verifyingDescription')}
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h1 className="text-2xl font-bold text-card-foreground mb-2">
                {t('success')}
              </h1>
              <p className="text-muted-foreground mb-6">
                {message}
              </p>
              <Link
                href={`/${locale}/login`}
                className="inline-block px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors"
              >
                {t('goToLogin')}
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              {message.includes('already been used') || message.includes('already verified') ? (
                <>
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                  <h1 className="text-2xl font-bold text-card-foreground mb-2">
                    {t('alreadyVerified')}
                  </h1>
                  <p className="text-muted-foreground mb-6">
                    {message}
                  </p>
                  <Link
                    href={`/${locale}/login`}
                    className="block px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors"
                  >
                    {t('goToLogin')}
                  </Link>
                </>
              ) : (
                <>
                  <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                  <h1 className="text-2xl font-bold text-card-foreground mb-2">
                    {t('failed')}
                  </h1>
                  <p className="text-muted-foreground mb-6">
                    {message}
                  </p>
                  <div className="space-y-3">
                    <Link
                      href={`/${locale}/login`}
                      className="block px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors"
                    >
                      {t('goToLogin')}
                    </Link>
                    <Link
                      href={`/${locale}/check-email`}
                      className="block px-6 py-3 border border-border hover:bg-muted text-card-foreground font-medium rounded-lg transition-colors"
                    >
                      {t('requestNew')}
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <Mail className="w-4 h-4 mr-2" />
              <span>{t('checkSpamNote')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
