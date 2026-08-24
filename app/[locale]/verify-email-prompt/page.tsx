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

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useSession } from '@/lib/auth-client';
import { EmailVerificationPrompt } from '@/features/auth/components/email-verification-prompt';

/**
 * 邮箱验证引导页
 *
 * 登录/升级后跳转到此页:若邮箱未验证则提示用户完成验证(可重新发送验证邮件),
 * 验证完成前不放行进入仪表盘(已验证时重定向到仪表盘)。
 */
export default function VerifyEmailPromptPage() {
  const session = useSession();
  const router = useRouter();
  const locale = useLocale();

  // 已验证邮箱:放行到仪表盘
  useEffect(() => {
    if (!session.isPending && session.data?.user?.emailVerified) {
      router.replace(`/${locale}/dashboard`);
    }
  }, [session.isPending, session.data, router, locale]);

  // 会话加载中:占位
  if (session.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  // 未登录:引导登录
  if (!session.data?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  // 已验证:等待重定向
  if (session.data.user.emailVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  // 未验证:提示完成邮箱验证,直到验证通过才放行
  return <EmailVerificationPrompt email={session.data.user.email} />;
}
