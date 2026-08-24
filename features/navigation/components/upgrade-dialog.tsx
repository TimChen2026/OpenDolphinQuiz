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

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "@/lib/auth-client";

type UpgradeDialogProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * 客户(Guest)升级为正式用户对话框
 *
 * 客户输入团队/公司名称后调用 /api/auth/customer-upgrade 完成升级。
 * 升级成功后:邮箱未验证则跳转验证引导页(完成验证前不放行),
 * 已验证则刷新页面(服务端重新解析团队上下文)。
 * 供用户菜单与导航栏"仪表盘"入口共用。
 */
export function UpgradeDialog({ open, onClose }: UpgradeDialogProps) {
  const router = useRouter();
  const locale = useLocale();
  const session = useSession();
  const t = useTranslations();
  const [upgradeTeamName, setUpgradeTeamName] = useState("");
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  if (!open) {
    return null;
  }

  const handleUpgrade = async () => {
    const trimmed = upgradeTeamName.trim();
    if (!trimmed) {
      setUpgradeError(t("auth.upgrade.errors.teamNameRequired"));
      return;
    }
    setUpgradeError(null);
    setUpgrading(true);
    try {
      const response = await fetch("/api/auth/customer-upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) {
        setUpgradeError(data.error || t("auth.upgrade.errors.upgradeFailed"));
        return;
      }
      // 升级成功后关闭对话框并刷新页面
      onClose();
      setUpgradeTeamName("");
      router.refresh();
      // 邮箱未验证:引导完成邮箱验证,验证通过后才放行进入仪表盘
      if (!session.data?.user?.emailVerified) {
        router.push(`/${locale}/verify-email-prompt`);
      }
    } catch {
      setUpgradeError(t("auth.upgrade.errors.upgradeFailed"));
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4 border border-border">
        <h3 className="text-lg font-semibold mb-2">
          {t("auth.upgrade.title")}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t("auth.upgrade.description")}
        </p>
        <input
          type="text"
          value={upgradeTeamName}
          onChange={(e) => {
            setUpgradeTeamName(e.target.value);
            if (e.target.value.trim()) {
              setUpgradeError(null);
            }
          }}
          placeholder={t("auth.upgrade.teamNamePlaceholder")}
          autoComplete="organization"
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {upgradeError && (
          <p className="text-sm text-destructive mt-2">{upgradeError}</p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => {
              onClose();
              setUpgradeTeamName("");
              setUpgradeError(null);
            }}
            disabled={upgrading}
            className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:bg-hover transition-colors disabled:opacity-40"
          >
            {t("common.actions.cancel")}
          </button>
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {upgrading
              ? t("auth.upgrade.upgrading")
              : t("auth.upgrade.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
