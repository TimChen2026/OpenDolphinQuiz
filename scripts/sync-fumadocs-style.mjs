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

import { mkdir, copyFile } from "node:fs/promises";
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

try {
  await mkdir(targetDir, { recursive: true });
  await copyFile(sourcePath, targetPath);

  console.log(`Synced Fumadocs stylesheet to ${path.relative(rootDir, targetPath)}`);
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
