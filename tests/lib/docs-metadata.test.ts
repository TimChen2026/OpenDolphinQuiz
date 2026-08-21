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

import { getDocsDescription, getDocsMetadata, getDocsPath } from "@/lib/docs-metadata";

describe("docs metadata helpers", () => {
  it("builds locale-aware docs paths with as-needed default locale urls", () => {
    expect(getDocsPath("en")).toBe("/docs");
    expect(getDocsPath("zh")).toBe("/zh/docs");
    expect(getDocsPath("en", ["quickstart"])).toBe("/docs/quickstart");
    expect(getDocsPath("zh", ["quickstart"])).toBe("/zh/docs/quickstart");
  });

  it("falls back to a localized description when a page omits one", () => {
    expect(getDocsDescription("en", "Quickstart")).toBe(
      "Quickstart documentation from DolphinQuiz Docs.",
    );
    expect(getDocsDescription("zh", "快速开始")).toBe(
      "快速开始 的使用文档，来自 DolphinQuiz Docs。",
    );
  });

  it("returns canonical and alternate metadata for localized docs pages", () => {
    const metadata = getDocsMetadata({
      locale: "zh",
      slug: ["quickstart"],
      title: "快速开始",
    });

    expect(metadata.title).toBe("快速开始 | DolphinQuiz Docs");
    expect(metadata.description).toBe("快速开始 的使用文档，来自 DolphinQuiz Docs。");
    expect(metadata.alternates?.canonical).toBe("http://localhost:3000/zh/docs/quickstart");
    expect(metadata.alternates?.languages).toEqual({
      en: "http://localhost:3000/docs/quickstart",
      zh: "http://localhost:3000/zh/docs/quickstart",
    });
    expect(metadata.openGraph).toMatchObject({
      title: "快速开始 | DolphinQuiz Docs",
      locale: "zh_CN",
      url: "http://localhost:3000/zh/docs/quickstart",
    });
  });
});
