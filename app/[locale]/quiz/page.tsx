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

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n.config";
import {
  getFirstActiveClientTemplate,
  getClientTemplateById,
} from "@/lib/quiz/queries";
import { getEmailTemplatesByTenant } from "@/lib/dashboard/email-templates";
import { EMAIL_TEMPLATE_TYPES } from "@/lib/db/schema";
import { QuizFlowContainer } from "@/features/quiz/components/quiz-flow-container";
import { QuizRegisterGuard } from "@/features/quiz/components/quiz-register-guard";
import { Container } from "@/components/container";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "quiz" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; style?: string }>;
}) {
  const { t: templateParam, style: styleParam } = await searchParams;

  // 优先按链接中的模板 ID 加载,保证生成的问卷与系统设置完全对应(验收修订 2.1.8-b);
  // 无模板 ID 时回退到系统首个激活模板(MVP 兼容)
  const template = templateParam
    ? await getClientTemplateById(templateParam)
    : await getFirstActiveClientTemplate();

  if (!template) {
    return (
      <Container className="py-20 sm:py-32">
        <div className="text-center max-w-xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Quiz 暂未开放
          </h1>
          <p className="mt-4 text-muted-foreground">
            当前没有可用的 Quiz 模板,请稍后再试。
          </p>
        </div>
      </Container>
    );
  }

  // 获取该模板所属租户的 Summary 摘要模板(报告模板的 summary 决定 Quiz Summary 页内容)
  // 需先查出模板所属租户(当前客户端模板不含 tenantId)
  const summaryTemplate = await loadSummaryTemplateForTemplate(template.id);

  return (
    <Container className="py-8 sm:py-12">
      <QuizRegisterGuard templateId={template.id}>
        <QuizFlowContainer
          template={template}
          summaryTemplate={summaryTemplate}
          styleId={styleParam}
        />
      </QuizRegisterGuard>
    </Container>
  );
}

/**
 * 加载指定 Quiz 模板所属租户的 Summary 摘要模板内容
 *
 * 步骤:
 * 1. 按模板 ID 查询租户 ID
 * 2. 按租户获取全部邮件模板,取 summary 类型
 * 3. 失败时返回 null(界面回退到默认摘要展示)
 */
async function loadSummaryTemplateForTemplate(templateId: string) {
  try {
    const { getTemplateTenantId } = await import("@/lib/quiz/queries");
    const tenantId = await getTemplateTenantId(templateId);
    if (!tenantId) {
      return null;
    }
    const templates = await getEmailTemplatesByTenant(tenantId);
    const summary = templates[EMAIL_TEMPLATE_TYPES.SUMMARY];
    return summary
      ? { subject: summary.subject, body: summary.body }
      : null;
  } catch (error) {
    console.error("加载 Summary 模板失败:", error);
    return null;
  }
}
