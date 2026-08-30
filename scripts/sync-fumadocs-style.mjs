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

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sourcePath = path.join(
  rootDir,
  "node_modules",
  "fumadocs-ui",
  "dist",
  "style.css",
);
const targetDir = path.join(rootDir, "public");
const targetPath = path.join(targetDir, "fumadocs-style.css");

/**
 * 剥掉所有 `@layer utilities { ... }` 包装，保留规则内容。
 *
 * 原因：本项目 globals.css 使用 Tailwind v3 语法，Next.js 编译产物不含 @layer
 * （全部为非分层规则）。按 CSS 层叠规则，非分层样式优先级恒高于分层样式，
 * 导致 fumadocs（Tailwind v4，规则在 @layer utilities 内）的
 * `-translate-x-(--fd-sidebar-width)` 等工具类被项目 CSS 的通配重置规则
 * `*, :before, :after { --tw-translate-x: 0; ... }` 压制，文档站侧边栏折叠
 * （以及依赖 transform 的弹出层定位）因此失效。
 * 仅剥掉 utilities 层：theme/base 层保持分层，项目自身的全局样式与字体
 * 主题仍保持高优先级，避免文档页之外的视觉回归。
 */
function stripUtilitiesLayer(css) {
  const marker = "@layer utilities";
  let result = "";
  let cursor = 0;

  while (cursor < css.length) {
    const start = css.indexOf(marker, cursor);
    if (start === -1) {
      result += css.slice(cursor);
      break;
    }

    // 只处理块级声明 `@layer utilities {`，跳过纯声明 `@layer utilities;`
    let openBrace = start + marker.length;
    while (openBrace < css.length && /\s/.test(css[openBrace])) {
      openBrace++;
    }
    if (css[openBrace] !== "{") {
      // 纯声明（如 `@layer utilities;`），原样保留并继续向后查找
      result += css.slice(cursor, openBrace);
      cursor = openBrace;
      continue;
    }

    // 保留 marker 之前的内容
    result += css.slice(cursor, start);

    // 花括号配平，找到包装块的闭合 `}`
    let depth = 1;
    let close = openBrace + 1;
    while (close < css.length && depth > 0) {
      const ch = css[close];
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
      close++;
    }

    // 写入块内容（去掉最外层包装与闭合括号）
    result += css.slice(openBrace + 1, close - 1);
    cursor = close;
  }

  return result;
}

try {
  await mkdir(targetDir, { recursive: true });

  const source = await readFile(sourcePath, "utf8");
  const transformed = stripUtilitiesLayer(source);
  await writeFile(targetPath, transformed, "utf8");

  console.log(
    `Synced Fumadocs stylesheet (utilities layer stripped) to ${path.relative(rootDir, targetPath)}`,
  );
} catch (error) {
  console.error(
    [
      "Failed to sync the Fumadocs stylesheet.",
      "Expected source:",
      `  ${path.relative(rootDir, sourcePath)}`,
      "Run `pnpm install` to restore dependencies before running dev/build again.",
    ].join("\n"),
  );

  throw error;
}
