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
  it("follow_up → won 允许", () => {
    expect(canTransitionStatus("follow_up", "won")).toBe(true);
  });

  it("follow_up → lost 允许", () => {
    expect(canTransitionStatus("follow_up", "lost")).toBe(true);
  });

  it("follow_up → follow_up 允许(保持原状)", () => {
    expect(canTransitionStatus("follow_up", "follow_up")).toBe(true);
  });

  it("lost → follow_up 允许(lost 可回 follow_up)", () => {
    expect(canTransitionStatus("lost", "follow_up")).toBe(true);
  });

  it("lost → won 不允许", () => {
    expect(canTransitionStatus("lost", "won")).toBe(false);
  });

  it("won → follow_up 不允许(won 为终态)", () => {
    expect(canTransitionStatus("won", "follow_up")).toBe(false);
  });

  it("won → lost 不允许", () => {
    expect(canTransitionStatus("won", "lost")).toBe(false);
  });

  it("非法状态不允许流转", () => {
    expect(canTransitionStatus("未知状态", "follow_up")).toBe(false);
  });
});

describe("isProjectEnded", () => {
  it("won 视为项目结束", () => {
    expect(isProjectEnded("won")).toBe(true);
  });

  it("lost 视为项目结束", () => {
    expect(isProjectEnded("lost")).toBe(true);
  });

  it("follow_up 不算结束", () => {
    expect(isProjectEnded("follow_up")).toBe(false);
  });

  it("null 不算结束", () => {
    expect(isProjectEnded(null)).toBe(false);
  });
});
