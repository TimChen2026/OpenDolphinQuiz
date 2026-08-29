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

// Dashboard 报告模板编辑(Phase 3 验收修订 2.1.2/2.1.7.4/2.1.9-b)
//
// 功能:
// - 展示邮件模板类型(内部告知/Summary/预警黄/预警红)
// - 每个模板展示收件人(To)与抄送(CC),让用户一目了然知道邮件设置是否正确
// - 编辑邮件主题与正文(@变量 占位符)
// - 保存按钮写入数据库
//
// 说明:
// - 已删除"项目报告邮件"模块(与内部告知邮件重复)
// - "询盘接近/达到上限提醒"模板为开发团队内部使用,仅在管理后台可调整(验收修订 2.1.9-b)

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import type { EmailTemplateData } from "@/features/dashboard/types";

// 模板类型显示顺序与收件人(To/CC)展示;显示字段存翻译键,渲染时经 t() 解析
const TEMPLATE_ORDER: {
  type: string;
  labelKey: string;
  hintKey: string;
  toKey: string;
  ccKey: string | null;
}[] = [
  {
    type: "internal",
    labelKey: "types.internal.label",
    hintKey: "types.internal.hint",
    toKey: "types.internal.to",
    ccKey: "types.internal.cc",
  },
  {
    type: "summary",
    labelKey: "types.summary.label",
    hintKey: "types.summary.hint",
    toKey: "types.summary.to",
    ccKey: null,
  },
  {
    type: "warning_yellow",
    labelKey: "types.warningYellow.label",
    hintKey: "types.warningYellow.hint",
    toKey: "types.warningYellow.to",
    ccKey: "types.warningYellow.cc",
  },
  {
    type: "warning_red",
    labelKey: "types.warningRed.label",
    hintKey: "types.warningRed.hint",
    toKey: "types.warningRed.to",
    ccKey: "types.warningRed.cc",
  },
];

// 可用变量提示(@变量为数据契约,后端按英文 token 字面替换(/lib/quiz/internal-email.ts))
const AVAILABLE_VARS = [
  "@ProjectNo",
  "@CustomerName",
  "@Topic",
  "@CustomerPhone",
  "@CustomerEmail",
  "@InquiryTime",
  "@Duration",
  "@SalesManager",
  "@SelectedPath",
  "@TodayInquiryCount",
  "@PricingLink",
];

export function ReportTemplatesView() {
  const t = useTranslations("dashboard.views.report");
  const tc = useTranslations("dashboard.views.common");
  const [templates, setTemplates] = useState<
    Record<string, EmailTemplateData> | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: string; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/email-templates");
      if (!res.ok) {
        throw new Error(tc("loadFailed"));
      }
      const json = (await res.json()) as { templates: Record<string, EmailTemplateData> };
      setTemplates(json.templates);
    } catch {
      setSaveMessage({ type: "error", text: tc("loadFailed") });
    } finally {
      setLoading(false);
    }
  }, [tc]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateTemplate = (type: string, field: "subject" | "body", value: string) => {
    setTemplates((prev) => {
      if (!prev || !prev[type]) {
        return prev;
      }
      return {
        ...prev,
        [type]: { ...prev[type], [field]: value },
      };
    });
  };

  const handleSave = async (type: string) => {
    const template = templates?.[type];
    if (!template) {
      return;
    }
    setSavingType(type);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/dashboard/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateType: type,
          subject: template.subject,
          body: template.body,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error ?? tc("saveFailed"));
      }
      setSaveMessage({ type: "success", text: t("templateSaved") });
    } catch (err) {
      setSaveMessage({
        type: "error",
        text: err instanceof Error ? err.message : tc("saveFailed"),
      });
    } finally {
      setSavingType(null);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-muted-foreground">{tc("loading")}</div>;
  }

  if (!templates) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        {tc("noTemplates")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 变量提示 */}
      <div className="rounded-2xl border border-border bg-background p-4 text-xs text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">{t("availableVars")}</p>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_VARS.map((v) => (
            <code key={v} className="rounded bg-muted px-2 py-0.5">
              {v}
            </code>
          ))}
        </div>
      </div>

      {TEMPLATE_ORDER.map(({ type, labelKey, hintKey, toKey, ccKey }) => {
        const template = templates[type];
        if (!template) {
          return null;
        }
        return (
          <div
            key={type}
            className="rounded-2xl border border-border bg-background p-5"
          >
            <div className="mb-4">
              <h3 className="font-semibold text-foreground">{t(labelKey)}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{t(hintKey)}</p>
            </div>

            {/* To/CC 收件人展示(2.1.2:让用户一目了然邮件设置) */}
            <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">{t("sendTo")}</span>
                <span className="text-muted-foreground">{t(toKey)}</span>
              </span>
              {ccKey && (
                <span className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground">{t("ccLabel")}</span>
                  <span className="text-muted-foreground">{t(ccKey)}</span>
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">
                  {t("subject")}
                </label>
                <input
                  value={template.subject}
                  onChange={(e) => updateTemplate(type, "subject", e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">
                  {t("body")}
                </label>
                <textarea
                  value={template.body}
                  onChange={(e) => updateTemplate(type, "body", e.target.value)}
                  rows={6}
                  style={{ height: "300px" }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => handleSave(type)}
                disabled={savingType === type}
              >
                {savingType === type ? tc("saving") : tc("save")}
              </Button>
            </div>
          </div>
        );
      })}

      {saveMessage && (
        <p
          className={
            saveMessage.type === "success"
              ? "text-sm text-green-600"
              : "text-sm text-destructive"
          }
        >
          {saveMessage.text}
        </p>
      )}
    </div>
  );
}
