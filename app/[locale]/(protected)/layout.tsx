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

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { EmailVerifiedGuard } from "@/features/auth/components/email-verified-guard";
import { PassportGuard } from "@/features/auth/components/passport-guard";
import { NavBar } from "@/features/navigation/components/navbar";
import { getActiveSessionUser } from "@/lib/auth/session";

export default async function ProtectedLayout(
  props: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;

  const {
    locale
  } = params;

  const {
    children
  } = props;

  const access = await getActiveSessionUser(await headers());
  if (!access.ok) {
    redirect(`/${locale}/login`);
  }

  return (
    <EmailVerifiedGuard requireEmailVerification={true}>
      <main className="min-h-screen">
        <NavBar />
        <PassportGuard>{children}</PassportGuard>
      </main>
    </EmailVerifiedGuard>
  );
}
