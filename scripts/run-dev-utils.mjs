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

export const MALLOC_STACK_LOGGING_WARNING =
  "MallocStackLogging: can't turn off malloc stack logging because it was not enabled.";

const DEV_ENV_KEYS_TO_STRIP = [
  "npm_config_verify_deps_before_run",
  "NPM_CONFIG_VERIFY_DEPS_BEFORE_RUN",
  "npm_config__jsr_registry",
  "NPM_CONFIG__JSR_REGISTRY",
  "MallocStackLogging",
  "MallocStackLoggingNoCompact",
  "MallocScribble",
  "MallocGuardEdges",
  "MallocCheckHeapStart",
  "MallocCheckHeapEach",
  "MallocCheckHeapAbort",
  "MallocErrorAbort",
  "MallocNanoZone",
  "NODE_TLS_REJECT_UNAUTHORIZED",
  "DYLD_INSERT_LIBRARIES",
];

const NEXT_DEV_FLAG_KEYS = new Set(["--webpack", "--turbopack", "--turbo"]);

export function sanitizeDevEnv(env = process.env) {
  const cleanEnv = { ...env };

  for (const key of DEV_ENV_KEYS_TO_STRIP) {
    if (key in cleanEnv) {
      delete cleanEnv[key];
    }
  }

  return cleanEnv;
}

export function resolveNextDevArgs(argv = [], env = process.env) {
  const userArgs = Array.isArray(argv) ? [...argv] : [];
  const useWebpack = env.NEXT_DEV_BUNDLER === "webpack" || userArgs.includes("--webpack");
  const useTurbopack =
    !useWebpack &&
    (env.NEXT_DEV_BUNDLER === "turbopack" ||
      userArgs.includes("--turbopack") ||
      userArgs.includes("--turbo"));

  const nextArgs = ["dev"];

  if (useWebpack) {
    nextArgs.push("--webpack");
  } else if (useTurbopack) {
    nextArgs.push("--turbopack");
  }

  nextArgs.push(...userArgs.filter((arg) => !NEXT_DEV_FLAG_KEYS.has(arg)));

  return nextArgs;
}

export function isMallocStackLoggingNoise(line) {
  return line.includes(MALLOC_STACK_LOGGING_WARNING);
}
