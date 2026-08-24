/*
 * Copyright (C) 2026 DolphinQuiz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// 系统级共享参考模板
//
// 这些模板对系统所有用户可见,点击「使用参考模板」可一键将参考问卷
// （节点+选项+风格）应用到当前租户的激活模板,方便客户快速建立问卷。

import educationTemplateJson from "./education-template.json";

// 参考模板结构(与前端 LinkGenView 的 QuizPlan 节点结构对齐)
export type ReferenceTemplateOption = {
  optionLabel: string;
  optionText: string;
  targetNodeId: string | null;
  resultTheme: string | null;
  resultManagerId: string | null;
};

export type ReferenceTemplateNode = {
  id: string;
  level: string;
  question: string;
  parentId: string | null;
  options: ReferenceTemplateOption[];
};

export type ReferenceTemplate = {
  id: string;
  name: string;
  styleId: string;
  templateId: string;
  nodes: ReferenceTemplateNode[];
};

/**
 * 教育培训参考模板
 *
 * 来源:管理员在 Dashboard 中精心配置的「教育培训」方案
 * (阶段选择 → 兴趣方向 → 具体科目 → 结果节点),风格为 Oxford 深蓝。
 */
export const EDUCATION_REFERENCE_TEMPLATE: ReferenceTemplate =
  educationTemplateJson as ReferenceTemplate;

// 所有共享参考模板的列表(当前仅教育培训一个)
export const REFERENCE_TEMPLATES: ReferenceTemplate[] = [
  EDUCATION_REFERENCE_TEMPLATE,
];

/** 按 ID 查找参考模板 */
export function findReferenceTemplate(id: string): ReferenceTemplate | null {
  return REFERENCE_TEMPLATES.find((t) => t.id === id) ?? null;
}