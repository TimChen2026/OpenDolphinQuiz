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

import { headers } from "next/headers";

// 用于根据时区做参考性地区推断,数据来源 IANA 时区库
export const TIMEZONE_TO_REGION: Record<string, string> = {
  "Asia/Shanghai": "中国",
  "Asia/Beijing": "中国",
  "Asia/Hong_Kong": "中国香港",
  "Asia/Taipei": "中国台湾",
  "America/New_York": "美国",
  "America/Chicago": "美国",
  "America/Denver": "美国",
  "America/Los_Angeles": "美国",
  "Europe/London": "英国",
  "Europe/Paris": "法国",
  "Europe/Berlin": "德国",
  "Asia/Tokyo": "日本",
  "Asia/Seoul": "韩国",
  "Asia/Singapore": "新加坡",
  "Australia/Sydney": "澳大利亚",
};

/**
 * 从请求头获取用户时区
 * 客户端通过 x-user-timezone 头传入浏览器时区
 */
export function getTimezoneFromHeaders(requestHeaders: Headers): string {
  return requestHeaders.get("x-user-timezone") || "UTC";
}

/**
 * 从next/headers获取时区(服务端组件使用)
 */
export async function getTimezoneFromRequest(): Promise<string> {
  const requestHeaders = await headers();
  return getTimezoneFromHeaders(requestHeaders);
}

/**
 * 显式语义标记:Date 内部已是 UTC 时间戳,此处仅强调意图
 */
export function toUTC(date: Date): Date {
  return new Date(date.toISOString());
}

/**
 * 将 UTC 时间转换为用户时区的"显示用"Date 对象
 *
 * 注意: 返回的 Date 对象使用本地时区构造,其字段值(getHours/getDate等)表示用户时区时间。
 * 仅适用于读取本地字段用于显示,禁止使用 .toISOString() 或 .getTime()(会返回错误结果)。
 * 如需格式化字符串,请使用 formatInTimezone。
 *
 * @throws {RangeError} 当 timezone 不是有效 IANA 时区时
 */
export function toUserTimezone(date: Date, timezone: string): Date {
  // Intl 是唯一可靠获取任意时区字段值的标准 API,避免引入额外依赖
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "0";
  const year = parseInt(getPart("year"), 10);
  const month = parseInt(getPart("month"), 10) - 1;
  const day = parseInt(getPart("day"), 10);
  // % 24: 某些 Node 版本 hour12:false 时返回 "24",需归一为 0
  const hour = parseInt(getPart("hour"), 10) % 24;
  const minute = parseInt(getPart("minute"), 10);
  const second = parseInt(getPart("second"), 10);

  return new Date(year, month, day, hour, minute, second);
}

/**
 * 根据时区推断地区(参考性判断,不作为业务强约束)
 */
export function guessRegionFromTimezone(timezone: string): string {
  return TIMEZONE_TO_REGION[timezone] || "未知";
}

/**
 * 在指定时区格式化日期为字符串
 * 推荐使用此函数进行时区显示,而非 toUserTimezone
 *
 * @throws {RangeError} 当 timezone 不是有效 IANA 时区时
 */
export function formatInTimezone(
  date: Date,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: timezone,
    ...options,
  }).format(date);
}
