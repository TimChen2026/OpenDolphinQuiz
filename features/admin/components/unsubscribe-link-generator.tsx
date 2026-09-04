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

// 退订链接生成器(GDPR 合规退订机制 · Admin Panel Unsubscribe 板块)
// 输入邮箱 → Server Action 生成加密 Token 链接 → 一键复制,
// 供管理员手动添加到 Outlook / Foxmail / 邮件模板的取消订阅位置。

import * as React from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, ExternalLink, Loader2, Link2 } from "lucide-react";

import { Button } from "@/components/button";
import { Label } from "@/components/ui/label";
import { generateUnsubscribeLinkAction } from "@/features/admin/actions/unsubscribe-actions";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function UnsubscribeLinkGenerator() {
  const t = useTranslations("Admin.unsubscribe.generator");
  const [email, setEmail] = React.useState("");
  const [url, setUrl] = React.useState<string | null>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [hasCopied, setHasCopied] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setHasCopied(false);

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError(t("invalidEmail"));
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateUnsubscribeLinkAction(email);
      if (result.success && result.url) {
        setUrl(result.url);
      } else {
        setError(result.error === "invalid_email" ? t("invalidEmail") : result.error ?? null);
      }
    } catch {
      setError(t("invalidEmail"));
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  }

  return (
    <section className="rounded-2xl border border-border bg-background p-6">
      <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>

      <form onSubmit={handleGenerate} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="unsubscribe-email">{t("emailLabel")}</Label>
          <input
            id="unsubscribe-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("emailPlaceholder")}
            className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <Button type="submit" disabled={isGenerating} className="sm:mb-0">
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("generating")}
            </>
          ) : (
            <>
              <Link2 className="mr-2 h-4 w-4" />
              {t("generateButton")}
            </>
          )}
        </Button>
      </form>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {url && (
        <div className="mt-4 space-y-2">
          <Label htmlFor="unsubscribe-url">{t("generatedUrlLabel")}</Label>
          <div className="flex items-center gap-2">
            <input
              id="unsubscribe-url"
              readOnly
              value={url}
              className="h-9 w-full flex-1 rounded-md border border-border bg-muted px-3 text-xs text-muted-foreground"
            />
            <Button type="button" variant="outline" onClick={handleCopy}>
              {hasCopied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {t("copiedButton")}
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  {t("copyButton")}
                </>
              )}
            </Button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {t("openButton")}
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
