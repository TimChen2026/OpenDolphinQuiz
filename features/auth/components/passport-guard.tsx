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
import { useSession } from "@/lib/auth-client";
import { TurnstileWidget } from "@/features/auth/components/turnstile";

/**
 * 通行证Guard:校验用户通行证状态
 * 通行证无效时显示Turnstile重新验证界面
 */
export function PassportGuard({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const [passportStatus, setPassportStatus] = React.useState<
    "loading" | "valid" | "invalid"
  >("loading");
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [refreshError, setRefreshError] = React.useState<string | null>(null);

  // 校验通行证状态
  React.useEffect(() => {
    if (!session.data?.user?.id) {
      return;
    }

    setPassportStatus("loading");
    fetch("/api/auth/verify-passport")
      .then((res) => res.json())
      .then((data) => {
        setPassportStatus(data.valid ? "valid" : "invalid");
      })
      .catch(() => {
        setPassportStatus("invalid");
      });
  }, [session.data?.user?.id]);

  // 刷新通行证
  async function handleRefreshPassport() {
    if (!turnstileToken) {
      setRefreshError("请先完成人机验证");
      return;
    }

    try {
      setIsRefreshing(true);
      setRefreshError(null);

      const response = await fetch("/api/auth/refresh-passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ turnstileToken }),
      });

      if (response.ok) {
        setPassportStatus("valid");
        setTurnstileToken(null);
      } else {
        const data = await response.json().catch(() => ({}));
        setRefreshError(data.error || "通行证刷新失败,请重试");
      }
    } catch {
      setRefreshError("网络错误,请重试");
    } finally {
      setIsRefreshing(false);
    }
  }

  // 会话加载中
  if (session.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  // 未登录(由layout处理,这里不渲染)
  if (!session.data?.user) {
    return null;
  }

  // 通行证校验中
  if (passportStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  // 通行证无效,显示重新验证界面
  if (passportStatus === "invalid") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-foreground">
              通行证验证
            </h1>
            <p className="text-sm text-muted-foreground">
              您的通行证已过期或未验证,请完成人机验证以继续访问
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                人机验证
              </label>
              <TurnstileWidget
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken(null)}
                onError={() => setTurnstileToken(null)}
              />
            </div>

            {refreshError && (
              <p className="text-sm text-destructive">{refreshError}</p>
            )}

            <button
              type="button"
              onClick={handleRefreshPassport}
              disabled={!turnstileToken || isRefreshing}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isRefreshing ? "验证中..." : "验证并继续"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 通行证有效,渲染子组件
  return <>{children}</>;
}
