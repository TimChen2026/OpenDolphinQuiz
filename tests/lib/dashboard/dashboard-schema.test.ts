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

// Phase 3 Dashboard 相关表 schema 测试
//
// 验证:
// - email_templates 表结构
// - warning_settings 表结构(每租户唯一)
// - projects 表新增预警时间列

import { describe, it, expect } from "vitest";
import {
  emailTemplates,
  warningSettings,
  projects,
  EMAIL_TEMPLATE_TYPES,
} from "@/lib/db/schema";

describe("email_templates schema", () => {
  it("包含租户隔离与模板字段", () => {
    expect(emailTemplates.tenantId).toBeDefined();
    expect(emailTemplates.templateType).toBeDefined();
    expect(emailTemplates.name).toBeDefined();
    expect(emailTemplates.subject).toBeDefined();
    expect(emailTemplates.body).toBeDefined();
  });

  it("模板类型常量完整", () => {
    expect(EMAIL_TEMPLATE_TYPES.WARNING_YELLOW).toBe("warning_yellow");
    expect(EMAIL_TEMPLATE_TYPES.WARNING_RED).toBe("warning_red");
    expect(EMAIL_TEMPLATE_TYPES.INTERNAL).toBe("internal");
  });
});

describe("warning_settings schema", () => {
  it("包含租户与黄/红阈值字段", () => {
    expect(warningSettings.tenantId).toBeDefined();
    expect(warningSettings.tenantId.name).toBe("tenant_id");
    expect(warningSettings.yellowHours).toBeDefined();
    expect(warningSettings.redHours).toBeDefined();
  });

  it("默认阈值:黄 24h / 红 48h", () => {
    expect(warningSettings.yellowHours.default).toBe(24);
    expect(warningSettings.redHours.default).toBe(48);
  });
});

describe("projects 预警时间列", () => {
  it("包含黄色/红色预警时间与通知时间列", () => {
    expect(projects.warningYellowAt).toBeDefined();
    expect(projects.warningRedAt).toBeDefined();
    expect(projects.notificationTime).toBeDefined();
  });
});
