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

import { docsI18n } from "@/lib/docs-i18n";
import { docsI18nUI, getDocsBaseOptions } from "@/lib/docs-ui";

describe("docs UI config", () => {
  it("supports English and Chinese docs locales", () => {
    expect(docsI18n.defaultLanguage).toBe("en");
    expect(docsI18n.languages).toEqual(["en", "zh"]);
    expect(docsI18n.hideLocale).toBe("default-locale");
  });

  it("builds locale-aware navigation urls", () => {
    expect(getDocsBaseOptions("en").nav?.url).toBe("/docs");
    expect(getDocsBaseOptions("zh").nav?.url).toBe("/zh/docs");
  });

  it("provides localized labels for the docs UI", () => {
    const zhProvider = docsI18nUI.provider("zh");
    const enProvider = docsI18nUI.provider("en");

    expect(zhProvider.locale).toBe("zh");
    expect(zhProvider.translations?.search).toBe("搜索文档");
    expect(enProvider.locale).toBe("en");
    expect(enProvider.translations?.search).toBe("Search docs");
    expect(zhProvider.locales?.map((item) => item.locale)).toEqual(["en", "zh"]);
  });
});
