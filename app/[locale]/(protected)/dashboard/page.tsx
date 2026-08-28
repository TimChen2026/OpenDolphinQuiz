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

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useTranslations } from "next-intl";
import { Container } from "@/components/container";
import { Background } from "@/components/background";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";

export default function DashboardPage() {
  const session = useSession();
  const t = useTranslations("dashboard");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // 支付完成回跳(Waffo successUrl 携带 upgrade=success):提示并刷新套餐展示
  const isUpgradeReturn = searchParams.get("upgrade") === "success";
  // 只处理一次:防止 StrictMode 双调用重复弹提示
  const upgradeHandledRef = useRef(false);

  useEffect(() => {
    if (!isUpgradeReturn || upgradeHandledRef.current) return;
    upgradeHandledRef.current = true;
    toast.success(t("paymentSuccessTitle"), {
      description: t("paymentSuccessDescription"),
    });
    // 立即刷新会话,个人菜单等读取会话套餐的位置马上更新
    void session.refetch();
    // 清理 URL 参数,避免刷新页面时重复提示
    router.replace(pathname, { scroll: false });
    // webhook 稍晚到达时的兜底:延迟再刷一次会话与服务端组件
    const delayedRefetch = setTimeout(() => {
      void session.refetch();
      router.refresh();
    }, 3000);
    // 有意不做 cleanup 清除定时器:replace 移除参数触发重渲染后仍需保住这次延迟刷新
    return undefined;
  }, [isUpgradeReturn, pathname, router, session.refetch, t]);

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
