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

import { db } from "@/lib/db";
import { quizTemplates, quizNodes, quizEdges, user } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  buildClientTemplate,
  type QuizClientTemplate,
  type QuizTemplateRecord,
  type QuizNodeRecord,
  type QuizEdgeRecord,
} from "./transform";

/**
 * 从节点列表批量查询选项边
 * 由于 Drizzle 在 Postgres 上对 IN 查询的支持需要 inArray,这里逐节点查询后合并
 * 节点数固定 21(决策树结构约束),性能可接受
 */
async function fetchEdgesForNodes(
  nodeIds: string[]
): Promise<QuizEdgeRecord[]> {
  const allEdges: QuizEdgeRecord[] = [];
  for (const nodeId of nodeIds) {
    const nodeEdges = await db
      .select()
      .from(quizEdges)
      .where(eq(quizEdges.nodeId, nodeId));
    allEdges.push(
      ...nodeEdges.map((e) => ({
        id: e.id,
        nodeId: e.nodeId,
        optionLabel: e.optionLabel,
        optionText: e.optionText,
        targetNodeId: e.targetNodeId,
        sortOrder: e.sortOrder,
        resultTheme: e.resultTheme,
        resultManagerId: e.resultManagerId,
        isEnabled: e.isEnabled,
      }))
    );
  }
  return allEdges;
}

/**
 * 将 DB 记录组装为客户端模板结构
 */
function assembleClientTemplate(
  template: { id: string; name: string; description: string | null },
  nodes: Array<{
    id: string;
    templateId: string;
    parentId: string | null;
    level: string;
    question: string;
    sortOrder: number;
    resultTheme: string | null;
    resultManagerId: string | null;
  }>,
  edges: QuizEdgeRecord[]
): QuizClientTemplate {
  const templateRecord: QuizTemplateRecord = {
    id: template.id,
    name: template.name,
    description: template.description,
  };

  const nodeRecords: QuizNodeRecord[] = nodes.map((n) => ({
    id: n.id,
    templateId: n.templateId,
    parentId: n.parentId,
    level: n.level,
    question: n.question,
    sortOrder: n.sortOrder,
    resultTheme: n.resultTheme,
    resultManagerId: n.resultManagerId,
  }));

  return buildClientTemplate(templateRecord, nodeRecords, edges);
}

/**
 * 获取指定租户的激活状态 Quiz 模板(含节点与选项)
 *
 * 查询逻辑:
 * 1. 按 tenant_id + status='active' 查询模板
 * 2. 按 template_id 查询所有节点
 * 3. 按 node_id 批量查询所有选项
 * 4. 通过 buildClientTemplate 组装为客户端结构
 *
 * @param tenantId 租户 ID(= user.id)
 * @returns 客户端模板结构,不存在时返回 null
 */
export async function getActiveClientTemplate(
  tenantId: string
): Promise<QuizClientTemplate | null> {
  // 查询激活状态的模板
  const templates = await db
    .select()
    .from(quizTemplates)
    .where(
      and(
        eq(quizTemplates.tenantId, tenantId),
        eq(quizTemplates.status, "active")
      )
    )
    .limit(1);

  if (templates.length === 0) {
    return null;
  }

  const template = templates[0];

  // 查询该模板的所有节点
  const nodes = await db
    .select()
    .from(quizNodes)
    .where(eq(quizNodes.templateId, template.id));

  if (nodes.length === 0) {
    return null;
  }

  // 批量查询选项
  const nodeIds = nodes.map((n) => n.id);
  const edges = await fetchEdgesForNodes(nodeIds);

  return assembleClientTemplate(template, nodes, edges);
}

/**
 * 获取指定 ID 的 Quiz 模板(用于 Summary 页读取完整路径)
 */
export async function getClientTemplateById(
  templateId: string
): Promise<QuizClientTemplate | null> {
  const templates = await db
    .select()
    .from(quizTemplates)
    .where(eq(quizTemplates.id, templateId))
    .limit(1);

  if (templates.length === 0) {
    return null;
  }

  const template = templates[0];

  const nodes = await db
    .select()
    .from(quizNodes)
    .where(eq(quizNodes.templateId, template.id));

  if (nodes.length === 0) {
    return null;
  }

  const nodeIds = nodes.map((n) => n.id);
  const edges = await fetchEdgesForNodes(nodeIds);

  return assembleClientTemplate(template, nodes, edges);
}

/**
 * 获取指定 Quiz 模板所属的租户 ID
 *
 * @param templateId Quiz 模板 ID
 * @returns 租户 ID,模板不存在时返回 null
 */
export async function getTemplateTenantId(
  templateId: string
): Promise<string | null> {
  const rows = await db
    .select({ tenantId: quizTemplates.tenantId })
    .from(quizTemplates)
    .where(eq(quizTemplates.id, templateId))
    .limit(1);
  return rows[0]?.tenantId ?? null;
}

/**
 * 按用户邮箱查询租户 ID
 *
 * 用于主页 Quiz 演示加载指定租户(演示账号)的激活模板,
 * 保证演示内容与该租户仪表盘生成的 Quiz 链接(/quiz?t=...)一致
 *
 * @param email 用户邮箱
 * @returns 租户 ID(= user.id),用户不存在时返回 null
 */
export async function getUserTenantIdByEmail(email: string): Promise<string | null> {
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email.trim().toLowerCase()))
    .limit(1);
  return rows[0]?.id ?? null;
}

/**
 * MVP 简化:获取系统中首个激活状态的 Quiz 模板
 *
 * 注意:此函数用于客户访问的 Quiz 公开页面,不要求登录
 * 多租户生产环境应通过子域名或 URL 参数识别租户,此处为 MVP 阶段的简化实现
 *
 * @returns 客户端模板结构,不存在时返回 null
 */
export async function getFirstActiveClientTemplate(): Promise<QuizClientTemplate | null> {
  const templates = await db
    .select()
    .from(quizTemplates)
    .where(eq(quizTemplates.status, "active"))
    .limit(1);

  if (templates.length === 0) {
    return null;
  }

  const template = templates[0];

  const nodes = await db
    .select()
    .from(quizNodes)
    .where(eq(quizNodes.templateId, template.id));

  if (nodes.length === 0) {
    return null;
  }

  const nodeIds = nodes.map((n) => n.id);
  const edges = await fetchEdgesForNodes(nodeIds);

  return assembleClientTemplate(template, nodes, edges);
}
