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

// 项目状态流转单元测试(Phase 3 Task 3.8)

import { describe, it, expect } from "vitest";
import {
  canTransitionStatus,
  isProjectEnded,
} from "@/lib/dashboard/project-status";

describe("canTransitionStatus", () => {
  it("跟进 → 获单 允许", () => {
    expect(canTransitionStatus("跟进", "获单")).toBe(true);
  });

  it("跟进 → 失单 允许", () => {
    expect(canTransitionStatus("跟进", "失单")).toBe(true);
  });

  it("跟进 → 跟进 允许(保持原状)", () => {
    expect(canTransitionStatus("跟进", "跟进")).toBe(true);
  });

  it("失单 → 跟进 允许(失单可回跟进)", () => {
    expect(canTransitionStatus("失单", "跟进")).toBe(true);
  });

  it("失单 → 获单 不允许", () => {
    expect(canTransitionStatus("失单", "获单")).toBe(false);
  });

  it("获单 → 跟进 不允许(获单为终态)", () => {
    expect(canTransitionStatus("获单", "跟进")).toBe(false);
  });

  it("获单 → 失单 不允许", () => {
    expect(canTransitionStatus("获单", "失单")).toBe(false);
  });

  it("非法状态不允许流转", () => {
    expect(canTransitionStatus("未知状态", "跟进")).toBe(false);
  });
});

describe("isProjectEnded", () => {
  it("获单视为项目结束", () => {
    expect(isProjectEnded("获单")).toBe(true);
  });

  it("失单视为项目结束", () => {
    expect(isProjectEnded("失单")).toBe(true);
  });

  it("跟进不算结束", () => {
    expect(isProjectEnded("跟进")).toBe(false);
  });

  it("null 不算结束", () => {
    expect(isProjectEnded(null)).toBe(false);
  });
});
