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

import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale, localePrefix } from './i18n.config';

// 认证相关页面统一使用英文版(login/signup/forgot-password/reset-password/
// check-email/verify-email/verify-email-prompt),zh 前缀访问时 302 到 en 版本,
// 保留查询参数(如 verify-email 的 token、login 的 callbackURL)
const ZH_AUTH_PATH_PATTERN =
  /^\/zh\/(login|signup|forgot-password|reset-password|check-email|verify-email|verify-email-prompt)(\/|$)/;

export const proxy = (request: NextRequest) => {
  const authMatch = ZH_AUTH_PATH_PATTERN.exec(request.nextUrl.pathname);
  if (authMatch) {
    const url = request.nextUrl.clone();
    url.pathname = `/en${request.nextUrl.pathname.slice('/zh'.length)}`;
    return NextResponse.redirect(url, 308);
  }
  return createMiddleware({
    locales,
    defaultLocale,
    localePrefix
  })(request);
};

export const config = {
  matcher: [
    '/',
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
