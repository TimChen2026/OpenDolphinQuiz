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

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const docsRoot = path.join(process.cwd(), "content", "docs");

function collectDocFiles(dir: string, prefix = ""): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const relativePath = prefix ? path.posix.join(prefix, entry.name) : entry.name;
    const absolutePath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return collectDocFiles(absolutePath, relativePath);
    }

    if (!entry.name.endsWith(".mdx")) return [];

    return [relativePath];
  });
}

describe("docs content", () => {
  it("keeps English and Chinese doc pages in parity", () => {
    const files = collectDocFiles(docsRoot);
    const englishFiles = files.filter((file) => !file.endsWith(".zh.mdx")).sort();
    const chineseFiles = files
      .filter((file) => file.endsWith(".zh.mdx"))
      .map((file) => file.replace(/\.zh\.mdx$/, ".mdx"))
      .sort();

    expect(englishFiles.length).toBeGreaterThan(0);
    expect(chineseFiles).toEqual(englishFiles);
  });

  it("keeps the root docs navigation aligned with the shipped guides", () => {
    const meta = JSON.parse(
      readFileSync(path.join(docsRoot, "meta.json"), "utf8"),
    ) as { pages: string[] };

    // Phase 0 清理：已移除 payments 和 ai 模块
    expect(meta.pages).toEqual([
      "index",
      "quickstart",
      "project-structure",
      "environment",
      "---Getting Started---",
      "auth",
      "email",
      "admin",
      "---Guides---",
      "deployment",
      "customization",
      "troubleshooting",
    ]);
  });

  it("ships localized docs landing pages", () => {
    const englishIndex = readFileSync(path.join(docsRoot, "index.mdx"), "utf8");
    const chineseIndex = readFileSync(path.join(docsRoot, "index.zh.mdx"), "utf8");

    expect(englishIndex).toContain("title: Introduction");
    expect(englishIndex).toContain("[Quickstart](./quickstart)");
    expect(chineseIndex).toContain("title: 简介");
    expect(chineseIndex).toContain("[快速开始](./quickstart)");
  });

  it("uses locale-safe relative links for internal docs references", () => {
    const docFiles = collectDocFiles(docsRoot);

    for (const file of docFiles) {
      const content = readFileSync(path.join(docsRoot, file), "utf8");
      expect(content).not.toMatch(/\]\(\/docs\//);
    }
  });
});
