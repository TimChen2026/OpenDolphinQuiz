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
import { useLocale } from 'next-intl';
import { useSession } from "@/lib/auth-client";
import { EmailVerificationPrompt } from "./email-verification-prompt";

interface EmailVerifiedGuardProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

/**
 * 邮箱验证守卫(受保护页面兜底拦截)
 *
 * - 未登录:重定向到登录页
 * - 已登录但邮箱未验证(requireEmailVerification):渲染 EmailVerificationPrompt,
 *   阻止进入受保护内容,直到完成邮箱验证
 * - 已验证:放行 children
 */
export function EmailVerifiedGuard({
  children,
  requireEmailVerification = true,
}: EmailVerifiedGuardProps) {
  const router = useRouter();
  const session = useSession();
  const locale = useLocale();

  React.useEffect(() => {
    if (!session.isPending && !session.data) {
      router.replace(`/${locale}/login`);
    }
  }, [router, session.data, session.isPending, locale]);

  // Loading state
  if (session.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  // Not authenticated
  if (!session.data?.user) {
    return null;
  }

  // Email not verified (if verification is required)
  if (requireEmailVerification && !session.data.user.emailVerified) {
    return <EmailVerificationPrompt email={session.data.user.email} />;
  }

  // Email verified or verification not required
  return <>{children}</>;
}
