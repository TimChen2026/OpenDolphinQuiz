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

// Quiz 问卷链接生成前的信息齐备性检查(Phase 3 验收修订 2.1.8)
//
// 功能:生成 Quiz 问卷链接前,程序进行一次内部检查,确认问卷信息齐备;
// 不齐备时返回缺失项清单,供界面提示用户哪里还缺少
//
// 检查项:
// 1. 节点问题非占位符(不以"请输入"开头且非空)
// 2. 选项文本非占位符且非空
// 3. P3 选项已关联主题词(result_theme 非空)
// 4. P3 选项已关联销售经理(result_manager_id 非空)

import { getEditableTemplate } from "./quiz-editor";

// 检查结果
export type LinkCheckResult = {
  ok: boolean;
  issues: LinkCheckIssue[];
};

// 单个缺失项
export type LinkCheckIssue = {
  nodeId: string;
  level: string;
  message: string;
};

// 占位符前缀(模板初始化的默认文本,英文)
const PLACEHOLDER_PREFIXES = ["Please enter"];

function isPlaceholder(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return true;
  }
  return PLACEHOLDER_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

/**
 * 检查 Quiz 模板信息齐备性
 *
 * @param templateId Quiz 模板 ID
 * @returns 检查结果(ok 表示可生成链接,issues 为缺失项列表)
 */
export async function checkTemplateReadiness(
  templateId: string
): Promise<LinkCheckResult> {
  const nodes = await getEditableTemplate(templateId);
  if (!nodes) {
    return {
      ok: false,
      issues: [{ nodeId: "", level: "-", message: "Quiz template does not exist" }],
    };
  }

  const issues: LinkCheckIssue[] = [];

  for (const node of nodes) {
    // 1. 节点问题非占位符(P4 结果节点内容由父级选项派生且编辑器只读,跳过校验)
    if (node.level === "P4") {
      continue;
    }
    if (isPlaceholder(node.question)) {
      issues.push({
        nodeId: node.id,
        level: node.level,
        message: `${node.level} node question${node.question ? ` (${node.question})` : ""} has not been filled in`,
      });
    }

    // 2. 选项文本非占位符且非空(P4 结果节点无选项,跳过;已关闭的选项不参与链接生成,跳过)
    for (const option of node.options) {
      if (!option.isEnabled) {
        continue;
      }
      if (isPlaceholder(option.optionText)) {
        issues.push({
          nodeId: node.id,
          level: node.level,
          message: `${node.level} node option ${option.optionLabel} text has not been filled in`,
        });
      }
    }

    // 3/4. P3 选项需关联主题词与销售经理(已关闭的选项跳过)
    if (node.level === "P3") {
      for (const option of node.options) {
        if (!option.isEnabled) {
          continue;
        }
        if (!option.resultTheme || option.resultTheme.trim() === "") {
          issues.push({
            nodeId: node.id,
            level: node.level,
            message: `P3 node option ${option.optionLabel} has no topic assigned`,
          });
        }
        if (!option.resultManagerId) {
          issues.push({
            nodeId: node.id,
            level: node.level,
            message: `P3 node option ${option.optionLabel} has no sales manager assigned`,
          });
        }
      }
    }
  }

  return { ok: issues.length === 0, issues };
}
