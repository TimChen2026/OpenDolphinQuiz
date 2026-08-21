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

// Dashboard 控制台首页(Phase 3)
//
// 重构为多 Tab 控制台:交互界面/逻辑界面/输入表格/报告模板/团队界面/邮件设置
// 对应需求 2.1.7 与 AC-04
//
// 个人信息编辑保留在 /settings 与 /profile 页面

import { useSession } from "@/lib/auth-client";
import { useTranslations } from "next-intl";
import { Container } from "@/components/container";
import { Background } from "@/components/background";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";

export default function DashboardPage() {
  const session = useSession();
  const t = useTranslations("dashboard");

  const user = session.data?.user;
  const displayName = user?.name || user?.email || "";

  return (
    <div className="relative min-h-screen">
      <Background />
      <Container className="relative z-10 py-10 sm:py-14">
        <div className="mb-10 mt-7">
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t("welcome")}, {displayName}
          </p>
        </div>

        <DashboardShell />
      </Container>
    </div>
  );
}
