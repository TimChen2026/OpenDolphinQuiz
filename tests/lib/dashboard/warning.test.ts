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

// 预警逻辑单元测试(Phase 3 Task 3.6/3.10)
//
// 覆盖:
// - computeWarningLevel:预警级别判断(黄/红/无)
// - computeDuration:持续时间与 3 天判断
// - renderTemplate:占位符替换

import { describe, it, expect } from "vitest";
import {
  computeWarningLevel,
  computeDuration,
  renderTemplate,
  type ComputeWarningParams,
} from "@/lib/dashboard/warning";

function buildParams(
  overrides: Partial<ComputeWarningParams> = {}
): ComputeWarningParams {
  return {
    projectStatus: "跟进",
    over3Days: false,
    durationHours: 10,
    yellowHours: 24,
    redHours: 48,
    yellowSent: false,
    redSent: false,
    ...overrides,
  };
}

describe("computeWarningLevel", () => {
  it("持续时间低于黄色阈值时不预警", () => {
    expect(
      computeWarningLevel(buildParams({ durationHours: 10 }))
    ).toBe("none");
  });

  it("持续时间达到黄色阈值触发黄色预警", () => {
    expect(
      computeWarningLevel(buildParams({ durationHours: 24 }))
    ).toBe("yellow");
  });

  it("持续时间达到红色阈值触发红色预警(优先于黄色)", () => {
    expect(
      computeWarningLevel(buildParams({ durationHours: 48 }))
    ).toBe("red");
  });

  it("项目结束(获单)后不预警", () => {
    expect(
      computeWarningLevel(
        buildParams({ projectStatus: "获单", durationHours: 48 })
      )
    ).toBe("none");
  });

  it("项目结束(失单)后不预警", () => {
    expect(
      computeWarningLevel(
        buildParams({ projectStatus: "失单", durationHours: 48 })
      )
    ).toBe("none");
  });

  it("超过 3 天不预警(判断前提)", () => {
    expect(
      computeWarningLevel(
        buildParams({ over3Days: true, durationHours: 48 })
      )
    ).toBe("none");
  });

  it("黄色预警已发送过不重复发送", () => {
    expect(
      computeWarningLevel(
        buildParams({ durationHours: 30, yellowSent: true })
      )
    ).toBe("none");
  });

  it("红色预警已发送过不重复发送", () => {
    expect(
      computeWarningLevel(
        buildParams({ durationHours: 60, redSent: true })
      )
    ).toBe("none");
  });

  it("超过红色阈值且黄色已发、红色未发时触发红色预警", () => {
    expect(
      computeWarningLevel(
        buildParams({ durationHours: 60, yellowSent: true, redSent: false })
      )
    ).toBe("red");
  });
});

describe("computeDuration", () => {
  const inquiryTime = new Date("2026-08-10T00:00:00Z");

  it("计算持续小时数(10 小时)", () => {
    const now = new Date("2026-08-10T10:00:00Z");
    const { durationHours, over3Days } = computeDuration(inquiryTime, now);
    expect(durationHours).toBeCloseTo(10, 5);
    expect(over3Days).toBe(false);
  });

  it("超过 3 天(72 小时)时 durationHours 为 null 且 over3Days 为 true", () => {
    const now = new Date("2026-08-13T01:00:00Z"); // 73 小时
    const { durationHours, over3Days } = computeDuration(inquiryTime, now);
    expect(over3Days).toBe(true);
    expect(durationHours).toBeNull();
  });

  it("恰好 72 小时不算超过 3 天", () => {
    const now = new Date("2026-08-13T00:00:00Z");
    const { durationHours, over3Days } = computeDuration(inquiryTime, now);
    expect(over3Days).toBe(false);
    expect(durationHours).toBeCloseTo(72, 5);
  });

  it("now 早于询盘时间时持续为 0", () => {
    const now = new Date("2026-08-09T00:00:00Z");
    const { durationHours } = computeDuration(inquiryTime, now);
    expect(durationHours).toBe(0);
  });
});

describe("renderTemplate", () => {
  it("替换占位符变量", () => {
    const result = renderTemplate(
      "Project @ProjectNo, customer @CustomerName",
      { ProjectNo: "张三-2026-08-10", CustomerName: "张三" }
    );
    expect(result).toBe("Project 张三-2026-08-10, customer 张三");
  });

  it("未提供的变量保持原样", () => {
    const result = renderTemplate("Topic:@Topic", { ProjectNo: "x" });
    expect(result).toBe("Topic:@Topic");
  });

  it("支持数字值替换", () => {
    const result = renderTemplate("Duration @Duration hours", {
      Duration: 24,
    });
    expect(result).toBe("Duration 24 hours");
  });
});
