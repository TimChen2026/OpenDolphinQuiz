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

// 邮件模板管理单元测试(Phase 3 Task 3.4)

import { describe, it, expect } from "vitest";
import {
  getDefaultTemplate,
  EMAIL_TEMPLATE_TYPES,
} from "@/lib/dashboard/email-templates";

describe("EMAIL_TEMPLATE_TYPES", () => {
  it("包含全部模板类型", () => {
    expect(EMAIL_TEMPLATE_TYPES.SUMMARY).toBe("summary");
    expect(EMAIL_TEMPLATE_TYPES.INTERNAL).toBe("internal");
    expect(EMAIL_TEMPLATE_TYPES.WARNING_YELLOW).toBe("warning_yellow");
    expect(EMAIL_TEMPLATE_TYPES.WARNING_RED).toBe("warning_red");
    expect(EMAIL_TEMPLATE_TYPES.INQUIRY_NEAR_LIMIT).toBe("inquiry_near_limit");
    expect(EMAIL_TEMPLATE_TYPES.INQUIRY_REACH_LIMIT).toBe("inquiry_reach_limit");
  });
});

describe("getDefaultTemplate", () => {
  it("返回黄色预警默认模板(含重要标识)", () => {
    const template = getDefaultTemplate(EMAIL_TEMPLATE_TYPES.WARNING_YELLOW);
    expect(template).not.toBeNull();
    expect(template?.subject).toContain("重要");
    expect(template?.body).toContain("@销售经理");
    expect(template?.body).toContain("@项目编号");
  });

  it("返回红色预警默认模板(含紧急标识)", () => {
    const template = getDefaultTemplate(EMAIL_TEMPLATE_TYPES.WARNING_RED);
    expect(template).not.toBeNull();
    expect(template?.subject).toContain("紧急");
  });

  it("返回内部告知邮件默认模板(含路径占位符)", () => {
    const template = getDefaultTemplate(EMAIL_TEMPLATE_TYPES.INTERNAL);
    expect(template?.body).toContain("@选择路径");
    expect(template?.body).toContain("@客户电话");
  });

  it("未知类型返回 null", () => {
    expect(getDefaultTemplate("unknown_type")).toBeNull();
  });
});
