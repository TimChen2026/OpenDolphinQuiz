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

import { spawn } from "node:child_process";
import { platform } from "node:os";
import {
  isMallocStackLoggingNoise,
  resolveNextDevArgs,
  sanitizeDevEnv,
} from "./run-dev-utils.mjs";

const cleanEnv = sanitizeDevEnv(process.env);
const nextArgs = resolveNextDevArgs(process.argv.slice(2), cleanEnv);

// Windows 兼容性修复: Windows 需要 .cmd 扩展名和 shell
const isWindows = platform() === "win32";
const command = isWindows ? "next.cmd" : "next";

const child = spawn(command, nextArgs, {
  stdio: ["inherit", "inherit", "pipe"],
  env: cleanEnv,
  shell: isWindows,
});

let stderrBuffer = "";
let suppressedMallocWarnings = 0;

child.stderr?.on("data", (chunk) => {
  stderrBuffer += chunk.toString();
  const lines = stderrBuffer.split(/\r?\n/);
  stderrBuffer = lines.pop() ?? "";

  for (const line of lines) {
    if (isMallocStackLoggingNoise(line)) {
      suppressedMallocWarnings += 1;
      continue;
    }

    process.stderr.write(`${line}\n`);
  }
});

child.on("exit", (code, signal) => {
  if (stderrBuffer && !isMallocStackLoggingNoise(stderrBuffer)) {
    process.stderr.write(stderrBuffer);
  } else if (stderrBuffer) {
    suppressedMallocWarnings += 1;
  }

  if (suppressedMallocWarnings > 0) {
    process.stderr.write(
      `[run-dev] Suppressed ${suppressedMallocWarnings} macOS allocator warning(s). If local dev is still sluggish, try "pnpm dev --webpack" or "pnpm dev:webpack".\n`,
    );
  }

  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
