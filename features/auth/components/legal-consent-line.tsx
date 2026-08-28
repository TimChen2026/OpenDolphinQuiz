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

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

/**
 * 注册/登录界面底部的条款声明行(参考 plane.so)
 * 按用户要求,文案固定用 "By signing in" 措辞,登录页与注册页共用同一句;
 * 五段式 i18n(prefix/terms/middle/privacy/suffix)以适配中英语序与句尾标点差异
 */
export function LegalConsentLine() {
  const locale = useLocale();
  const t = useTranslations("auth.legal");

  return (
    <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
      {t("prefix")}{" "}
      <Link
        href={`/${locale}/terms`}
        className="text-primary underline underline-offset-2 hover:opacity-80"
      >
        {t("terms")}
      </Link>{" "}
      {t("middle")}{" "}
      <Link
        href={`/${locale}/privacy`}
        className="text-primary underline underline-offset-2 hover:opacity-80"
      >
        {t("privacy")}
      </Link>
      {t("suffix")}
    </p>
  );
}
