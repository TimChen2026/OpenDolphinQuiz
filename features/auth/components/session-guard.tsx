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

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useSession();
  const locale = useLocale();

  React.useEffect(() => {
    if (!session.isPending && !session.data) {
      router.replace(`/${locale}/login`);
    }
  }, [locale, router, session.data, session.isPending]);

  if (session.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  if (!session.data?.user) {
    return null;
  }

  return <>{children}</>;
}
