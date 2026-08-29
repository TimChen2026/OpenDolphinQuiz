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

// Dashboard 内部告知邮件设置(Phase 3 Task 3.6)
//
// 功能:
// - 黄色预警阈值(默认 >=24h)
// - 红色预警阈值(默认 >=48h)
// - 保存到数据库

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import type { WarningSettings } from "@/features/dashboard/types";

const DEFAULT_SETTINGS: WarningSettings = { yellowHours: 24, redHours: 48 };

export function WarningSettingsView() {
  const t = useTranslations("dashboard.views.warning");
  const tc = useTranslations("dashboard.views.common");
  const [settings, setSettings] = useState<WarningSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/warning-settings");
      if (!res.ok) {
        throw new Error(tc("loadFailed"));
      }
      const json = (await res.json()) as { settings: WarningSettings };
      setSettings(json.settings);
    } catch {
      setMessage({ type: "error", text: t("loadSettingsFailed") });
    } finally {
      setLoading(false);
    }
  }, [t, tc]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    // 客户端校验:红色阈值须大于黄色阈值
    if (settings.yellowHours < 1) {
      setMessage({ type: "error", text: t("yellowMinError") });
      return;
    }
    if (settings.redHours <= settings.yellowHours) {
      setMessage({
        type: "error",
        text: t("redGreaterThanYellowError"),
      });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/dashboard/warning-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error ?? tc("saveFailed"));
      }
      setMessage({ type: "success", text: t("settingsSaved") });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : tc("saveFailed"),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        {tc("loading")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-background p-5">
        <h3 className="font-semibold text-foreground">{t("title")}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("description")}
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* 黄色预警 */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-amber-700">
              {t("yellowThreshold")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("yellowThresholdHint")}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={settings.yellowHours}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    yellowHours: Number(e.target.value),
                  }))
                }
                className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
              <span className="text-sm text-muted-foreground">{t("hours")}</span>
            </div>
          </div>

          {/* 红色预警 */}
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
            <p className="text-sm font-medium text-red-600">
              {t("redThreshold")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("redThresholdHint")}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min={2}
                value={settings.redHours}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    redHours: Number(e.target.value),
                  }))
                }
                className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
              <span className="text-sm text-muted-foreground">{t("hours")}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? tc("saving") : t("saveSettings")}
          </Button>
          {message && (
            <span
              className={
                message.type === "success"
                  ? "text-sm text-green-600"
                  : "text-sm text-destructive"
              }
            >
              {message.text}
            </span>
          )}
        </div>
      </div>

      {/* 预警说明 */}
      <div className="rounded-2xl border border-border bg-background p-5 text-xs text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">{t("rulesTitle")}</p>
        <ul className="list-inside list-disc space-y-1">
          <li>{t("rule1")}</li>
          <li>{t("rule2")}</li>
          <li>{t("rule3")}</li>
          <li>{t("rule4")}</li>
          <li>{t("rule5")}</li>
        </ul>
      </div>
    </div>
  );
}
