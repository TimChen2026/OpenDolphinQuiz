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

"use client";

// Dashboard 报告模板编辑(Phase 3 验收修订 2.1.2/2.1.7.4/2.1.9-b)
//
// 功能:
// - 展示邮件模板类型(内部告知/Summary/预警黄/预警红)
// - 每个模板展示收件人(To)与抄送(CC),让用户一目了然知道邮件设置是否正确
// - 编辑邮件主题与正文(@变量 占位符)
// - 保存按钮写入数据库
//
// 说明:
// - 已删除"项目报告邮件"模块(与内部告知邮件重复)
// - "询盘接近/达到上限提醒"模板为开发团队内部使用,仅在管理后台可调整(验收修订 2.1.9-b)

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/button";
import type { EmailTemplateData } from "@/features/dashboard/types";

// 模板类型显示顺序、说明与收件人(To/CC)展示
const TEMPLATE_ORDER: {
  type: string;
  label: string;
  hint: string;
  to: string;
  cc: string | null;
}[] = [
  {
    type: "internal",
    label: "内部告知邮件",
    hint: "客户询盘内部通知(新询盘时发送)",
    to: "销售经理(负责该主题)",
    cc: "销售总监",
  },
  {
    type: "summary",
    label: "Summary 摘要",
    hint: "客户完成 Quiz 后,展示在 Quiz 的 Summary 结果页",
    to: "客户(页面展示,不通过邮件)",
    cc: null,
  },
  {
    type: "warning_yellow",
    label: "黄色预警邮件",
    hint: "项目持续 >=24h 未回复时触发",
    to: "销售经理",
    cc: "销售总监",
  },
  {
    type: "warning_red",
    label: "红色预警邮件",
    hint: "项目持续 >=48h 未回复时触发",
    to: "销售经理",
    cc: "销售总监",
  },
];

// 可用变量提示
const AVAILABLE_VARS = [
  "@项目编号",
  "@客户名",
  "@主题",
  "@客户电话",
  "@客户邮箱",
  "@询盘时间",
  "@持续时间",
  "@销售经理",
  "@选择路径",
  "@今日询盘次数",
  "@定价页链接",
];

export function ReportTemplatesView() {
  const [templates, setTemplates] = useState<
    Record<string, EmailTemplateData> | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: string; text: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/email-templates");
      if (!res.ok) {
        throw new Error("加载失败");
      }
      const json = (await res.json()) as { templates: Record<string, EmailTemplateData> };
      setTemplates(json.templates);
    } catch {
      setSaveMessage({ type: "error", text: "加载模板失败" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateTemplate = (type: string, field: "subject" | "body", value: string) => {
    setTemplates((prev) => {
      if (!prev || !prev[type]) {
        return prev;
      }
      return {
        ...prev,
        [type]: { ...prev[type], [field]: value },
      };
    });
  };

  const handleSave = async (type: string) => {
    const template = templates?.[type];
    if (!template) {
      return;
    }
    setSavingType(type);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/dashboard/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateType: type,
          subject: template.subject,
          body: template.body,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error ?? "保存失败");
      }
      setSaveMessage({ type: "success", text: "模板已保存" });
    } catch (err) {
      setSaveMessage({
        type: "error",
        text: err instanceof Error ? err.message : "保存失败,请重试",
      });
    } finally {
      setSavingType(null);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-muted-foreground">加载中...</div>;
  }

  if (!templates) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        暂无可用模板
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 变量提示 */}
      <div className="rounded-2xl border border-border bg-background p-4 text-xs text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">可用变量(发送时自动替换):</p>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_VARS.map((v) => (
            <code key={v} className="rounded bg-muted px-2 py-0.5">
              {v}
            </code>
          ))}
        </div>
      </div>

      {TEMPLATE_ORDER.map(({ type, label, hint, to, cc }) => {
        const template = templates[type];
        if (!template) {
          return null;
        }
        return (
          <div
            key={type}
            className="rounded-2xl border border-border bg-background p-5"
          >
            <div className="mb-4">
              <h3 className="font-semibold text-foreground">{label}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </div>

            {/* To/CC 收件人展示(2.1.2:让用户一目了然邮件设置) */}
            <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">发送 To:</span>
                <span className="text-muted-foreground">{to}</span>
              </span>
              {cc && (
                <span className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground">抄送 CC:</span>
                  <span className="text-muted-foreground">{cc}</span>
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">
                  邮件主题
                </label>
                <input
                  value={template.subject}
                  onChange={(e) => updateTemplate(type, "subject", e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">
                  邮件正文
                </label>
                <textarea
                  value={template.body}
                  onChange={(e) => updateTemplate(type, "body", e.target.value)}
                  rows={6}
                  style={{ height: "300px" }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => handleSave(type)}
                disabled={savingType === type}
              >
                {savingType === type ? "保存中..." : "保存模板"}
              </Button>
            </div>
          </div>
        );
      })}

      {saveMessage && (
        <p
          className={
            saveMessage.type === "success"
              ? "text-sm text-green-600"
              : "text-sm text-destructive"
          }
        >
          {saveMessage.text}
        </p>
      )}
    </div>
  );
}
