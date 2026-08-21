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

// 项目编号生成工具
//
// 项目编号格式:客户名-YYYY-MM-DD-HHmmss(UTC)
// 示例:张三-2026-08-12-143025
//
// 设计说明:
// - 使用 UTC 时间保持多时区一致性(对应 AC-09:时区统一用 UTC)
// - 客户名清洗:仅保留中文/英文/数字/下划线,移除连字符(避免与分隔符冲突)
// - 同一秒内同一客户可能产生冲突,由调用方通过 DB 唯一约束 + 重试机制保证唯一性

/**
 * 清洗客户名,移除不安全字符
 *
 * 保留字符:中文、英文字母、数字、下划线
 * 移除字符:连字符(避免与项目编号分隔符冲突)及其他特殊字符
 * 空格替换为下划线
 *
 * @param customerName 原始客户名
 * @returns 清洗后的客户名,空或全特殊字符时返回 "unknown"
 */
export function sanitizeCustomerName(customerName: string): string {
  // 空格替换为下划线
  const withUnderscores = customerName.trim().replace(/\s+/g, "_");
  // 仅保留中文(\u4e00-\u9fa5)、英文(a-zA-Z)、数字(0-9)、下划线(_)
  const sanitized = withUnderscores.replace(/[^\u4e00-\u9fa5a-zA-Z0-9_]/g, "");
  return sanitized.length > 0 ? sanitized : "unknown";
}

/**
 * 生成项目编号
 *
 * 格式:客户名-YYYY-MM-DD-HHmmss(UTC 时间)
 * 示例:张三-2026-08-12-143025
 *
 * 唯一性保证:
 * - 同一客户同一秒生成的编号相同
 * - 调用方应通过 DB 唯一约束检测冲突,冲突时追加序号后缀(-1, -2, ...)
 *
 * @param customerName 客户名(将被清洗)
 * @param inquiryTime 询盘时间(UTC Date 对象)
 * @returns 项目编号字符串
 */
export function generateProjectNumber(
  customerName: string,
  inquiryTime: Date
): string {
  const sanitized = sanitizeCustomerName(customerName);

  // 使用 UTC 方法获取各时间分量,确保跨时区一致
  const year = inquiryTime.getUTCFullYear();
  const month = String(inquiryTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(inquiryTime.getUTCDate()).padStart(2, "0");
  const hours = String(inquiryTime.getUTCHours()).padStart(2, "0");
  const minutes = String(inquiryTime.getUTCMinutes()).padStart(2, "0");
  const seconds = String(inquiryTime.getUTCSeconds()).padStart(2, "0");

  return `${sanitized}-${year}-${month}-${day}-${hours}${minutes}${seconds}`;
}

/**
 * 生成带序号后缀的项目编号(用于冲突重试)
 *
 * 当 DB 检测到 project_number 唯一约束冲突时,调用此函数追加序号
 * 示例:张三-2026-08-12-143025 → 张三-2026-08-12-143025-1
 *
 * @param baseNumber 基础项目编号
 * @param retryCount 重试次数(从 1 开始)
 * @returns 带序号后缀的项目编号
 */
export function appendRetrySuffix(
  baseNumber: string,
  retryCount: number
): string {
  return `${baseNumber}-${retryCount}`;
}
