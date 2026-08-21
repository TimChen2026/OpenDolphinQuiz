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

// 询盘次数限制单元测试(Phase 3 Task 3.7 / AC-06)

import { describe, it, expect } from "vitest";
import {
  computeInquiryLimitStatus,
  FREE_DAILY_INQUIRY_LIMIT,
  INQUIRY_NEAR_LIMIT,
} from "@/lib/dashboard/inquiry-limit";

describe("computeInquiryLimitStatus", () => {
  it("默认阈值为 5 次/天上限,3 次接近上限", () => {
    expect(FREE_DAILY_INQUIRY_LIMIT).toBe(5);
    expect(INQUIRY_NEAR_LIMIT).toBe(3);
  });

  it("0 次时不限制", () => {
    const status = computeInquiryLimitStatus(0);
    expect(status.isLimited).toBe(false);
    expect(status.isNearLimit).toBe(false);
    expect(status.count).toBe(0);
  });

  it("2 次时不限制", () => {
    const status = computeInquiryLimitStatus(2);
    expect(status.isLimited).toBe(false);
    expect(status.isNearLimit).toBe(false);
  });

  it("3 次时接近上限(提示升级)", () => {
    const status = computeInquiryLimitStatus(3);
    expect(status.isLimited).toBe(false);
    expect(status.isNearLimit).toBe(true);
  });

  it("4 次时接近上限", () => {
    const status = computeInquiryLimitStatus(4);
    expect(status.isLimited).toBe(false);
    expect(status.isNearLimit).toBe(true);
  });

  it("5 次时达到硬上限(客户无法继续 Quiz)", () => {
    const status = computeInquiryLimitStatus(5);
    expect(status.isLimited).toBe(true);
    expect(status.isNearLimit).toBe(false);
  });

  it("6 次时仍为硬上限", () => {
    const status = computeInquiryLimitStatus(6);
    expect(status.isLimited).toBe(true);
  });

  it("自定义阈值生效", () => {
    const status = computeInquiryLimitStatus(8, 10, 6);
    expect(status.limit).toBe(10);
    expect(status.nearLimit).toBe(6);
    expect(status.isNearLimit).toBe(true);
    expect(status.isLimited).toBe(false);
  });
});
