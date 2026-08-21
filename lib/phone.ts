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

// 手机号校验工具
//
// 中国大陆手机号:11 位,1 开头,第二位 3-9
// 注册、手机号补充、Quiz 注册卡片共用,避免正则分散导致不一致

export const PHONE_PATTERN = /^1[3-9]\d{9}$/;

/**
 * 校验手机号格式(先去除首尾空格)
 */
export function isValidPhone(phone: string): boolean {
  return PHONE_PATTERN.test(phone.trim());
}
