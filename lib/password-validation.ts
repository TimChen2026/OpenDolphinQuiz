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

/**
 * 密码强度校验工具
 * 与后端 /api/auth/change-password 保持一致的校验规则
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: number; // 0-5 密码强度评分
}

/**
 * 校验密码强度
 * 规则：
 * - 至少 8 个字符
 * - 最多 128 个字符
 * - 至少包含一个大写字母
 * - 至少包含一个小写字母
 * - 至少包含一个数字
 * - 至少包含一个特殊字符
 * - 不允许连续 3 个相同字符
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // 长度检查
  if (password.length < 8) {
    errors.push("密码长度至少需要 8 个字符");
  } else {
    score++;
  }

  if (password.length > 128) {
    errors.push("密码长度不能超过 128 个字符");
  }

  // 大写字母
  if (!/[A-Z]/.test(password)) {
    errors.push("密码需要至少包含一个大写字母");
  } else {
    score++;
  }

  // 小写字母
  if (!/[a-z]/.test(password)) {
    errors.push("密码需要至少包含一个小写字母");
  } else {
    score++;
  }

  // 数字
  if (!/[0-9]/.test(password)) {
    errors.push("密码需要至少包含一个数字");
  } else {
    score++;
  }

  // 特殊字符
  if (!/[!@#$%^&*(),.?":{}|<>_\-+\[\]\\;\/~`]/.test(password)) {
    errors.push("密码需要至少包含一个特殊字符");
  } else {
    score++;
  }

  // 连续相同字符
  if (/(.)\1{2,}/.test(password)) {
    errors.push("密码不能包含连续 3 个相同字符");
  }

  return {
    isValid: errors.length === 0,
    errors,
    score,
  };
}

/**
 * 获取密码强度等级描述
 */
export function getPasswordStrengthLabel(score: number): string {
  switch (score) {
    case 0:
      return "太弱";
    case 1:
      return "弱";
    case 2:
      return "一般";
    case 3:
      return "中等";
    case 4:
      return "强";
    case 5:
      return "非常强";
    default:
      return "未知";
  }
}

/**
 * 获取密码强度对应的颜色类
 */
export function getPasswordStrengthColor(score: number): string {
  if (score <= 1) return "bg-red-500";
  if (score <= 2) return "bg-orange-500";
  if (score <= 3) return "bg-yellow-500";
  if (score <= 4) return "bg-green-500";
  return "bg-emerald-500";
}