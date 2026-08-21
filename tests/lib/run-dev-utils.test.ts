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

import {
  isMallocStackLoggingNoise,
  resolveNextDevArgs,
  sanitizeDevEnv,
} from "../../scripts/run-dev-utils.mjs";

describe("run-dev utils", () => {
  it("strips noisy npm and macOS allocator env vars before spawning Next dev", () => {
    const cleanEnv = sanitizeDevEnv({
      NODE_ENV: "test",
      PATH: "/usr/bin",
      npm_config_verify_deps_before_run: "true",
      MallocStackLogging: "1",
      MallocNanoZone: "0",
      NODE_TLS_REJECT_UNAUTHORIZED: "0",
      DYLD_INSERT_LIBRARIES: "/tmp/libMallocDebug.dylib",
      CUSTOM_VALUE: "keep-me",
    } as NodeJS.ProcessEnv);

    expect(cleanEnv).toEqual({
      NODE_ENV: "test",
      PATH: "/usr/bin",
      CUSTOM_VALUE: "keep-me",
    });
  });

  it("supports switching dev bundlers without duplicating flags", () => {
    expect(resolveNextDevArgs(["--webpack", "-p", "3001"], {} as NodeJS.ProcessEnv)).toEqual([
      "dev",
      "--webpack",
      "-p",
      "3001",
    ]);
    expect(resolveNextDevArgs(["--turbo"], {} as NodeJS.ProcessEnv)).toEqual(["dev", "--turbopack"]);
    expect(resolveNextDevArgs([], { NODE_ENV: "test", NEXT_DEV_BUNDLER: "webpack" } as NodeJS.ProcessEnv)).toEqual([
      "dev",
      "--webpack",
    ]);
  });

  it("recognizes the macOS malloc warning so the launcher can suppress it", () => {
    expect(
      isMallocStackLoggingNoise(
        "node(12345) MallocStackLogging: can't turn off malloc stack logging because it was not enabled.",
      ),
    ).toBe(true);
    expect(isMallocStackLoggingNoise("ready - started server on 0.0.0.0:3000")).toBe(false);
  });
});
