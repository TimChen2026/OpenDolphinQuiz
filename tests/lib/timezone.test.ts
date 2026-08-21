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

import { describe, it, expect } from "vitest";
import {
  toUTC,
  toUserTimezone,
  guessRegionFromTimezone,
  formatInTimezone,
  TIMEZONE_TO_REGION,
} from "@/lib/timezone";

describe("timezone", () => {
  it("toUTC 返回UTC时间", () => {
    const date = new Date("2026-08-10T10:00:00+08:00");
    const utc = toUTC(date);
    expect(utc.toISOString()).toBe("2026-08-10T02:00:00.000Z");
  });

  // 此测试验证 toUserTimezone 返回的 Date 本地字段值与 Intl 提取的用户时区字段一致
  // 注意: 依赖运行环境本地时区,仅验证字段映射,不验证时间戳正确性
  it("toUserTimezone Asia/Shanghai 返回+8时间", () => {
    const utcDate = new Date("2026-08-10T02:00:00.000Z");
    const userDate = toUserTimezone(utcDate, "Asia/Shanghai");
    expect(userDate.getHours()).toBe(10);
  });

  // 真正验证时区转换:formatInTimezone 输出字符串包含用户时区的正确时间
  it("formatInTimezone Asia/Shanghai 输出北京时间", () => {
    const utcDate = new Date("2026-08-10T02:00:00.000Z");
    const formatted = formatInTimezone(utcDate, "Asia/Shanghai", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    // Asia/Shanghai 是 UTC+8,02:00 UTC 对应 10:00
    expect(formatted).toBe("10:00");
  });

  it("guessRegionFromTimezone Asia/Shanghai 返回中国", () => {
    expect(guessRegionFromTimezone("Asia/Shanghai")).toBe("中国");
  });

  it("guessRegionFromTimezone America/New_York 返回美国", () => {
    expect(guessRegionFromTimezone("America/New_York")).toBe("美国");
  });

  it("guessRegionFromTimezone 未知时区返回未知", () => {
    expect(guessRegionFromTimezone("Unknown/Zone")).toBe("未知");
  });

  it("TIMEZONE_TO_REGION 包含常见时区", () => {
    expect(TIMEZONE_TO_REGION["Asia/Shanghai"]).toBe("中国");
    expect(TIMEZONE_TO_REGION["America/New_York"]).toBe("美国");
    expect(TIMEZONE_TO_REGION["Europe/London"]).toBe("英国");
  });
});
