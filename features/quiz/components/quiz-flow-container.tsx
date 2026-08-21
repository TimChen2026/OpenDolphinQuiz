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

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QuizFlow } from "./quiz-flow";
import { QuizSubmitView } from "./quiz-submit-view";
import type { QuizClientTemplate, QuizResult } from "@/lib/quiz/transform";

type QuizFlowContainerProps = {
  template: QuizClientTemplate;
  /** 报告模板中的 Summary 摘要(subject/body,决定 P4 Summary 页内容) */
  summaryTemplate: { subject: string; body: string } | null;
  /** 选定风格 ID(如 classic/princeton 等),控制 Quiz 问卷配色 */
  styleId?: string;
};

// 提交状态
type SubmitState = "idle" | "submitting" | "success" | "error";

// 提交结果
type SubmitResultData = {
  projectNumber: string;
  emailSent: boolean;
  emailError?: string | null;
};

/**
 * Quiz 流程容器组件
 *
 * 管理流程:
 * 1. 问答阶段:QuizFlow,客户从 P1 逐步选择到 P3,再进入 P4 结果层
 * 2. P4 结果层展示报告模板 summary 摘要 + "返回开始"按钮
 * 3. 点击"返回开始"→ 调用 /api/quiz/submit
 *    (生成项目编号 + 记录询盘时间到 DB + 发送 Internal Email)
 *    → 成功显示 QuizSubmitView(项目编号 + 邮件状态)
 */
export function QuizFlowContainer({
  template,
  summaryTemplate,
  styleId,
}: QuizFlowContainerProps) {
  const router = useRouter();
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitResult, setSubmitResult] = useState<SubmitResultData | null>(
    null
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  /**
   * P4 页点击"返回开始":提交询盘
   * 对应 AC-03:建立项目编号 + 记录 DB + 发送 Internal Email
   */
  const handleComplete = async (result: QuizResult) => {
    if (submitState === "submitting") {
      return;
    }
    setQuizResult(result);
    setSubmitState("submitting");
    setSubmitError(null);

    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ templateId: template.id, result }),
      });

      const data = (await response.json().catch(() => null)) as
        | (SubmitResultData & { success?: boolean; error?: string })
        | null;

      if (!response.ok || !data) {
        setSubmitError(data?.error ?? "询盘提交失败,请重试");
        setSubmitState("error");
        return;
      }

      setSubmitResult(data);
      setSubmitState("success");
    } catch {
      setSubmitError("网络异常,请重试");
      setSubmitState("error");
    }
  };

  /** 回到 Quiz 起点(重置所有状态) */
  const handleRestart = () => {
    setSubmitState("idle");
    setSubmitResult(null);
    setSubmitError(null);
    setQuizResult(null);
    router.refresh();
  };

  // 提交成功:展示项目编号与邮件状态
  if (submitState === "success" && submitResult) {
    return <QuizSubmitView result={submitResult} onRestart={handleRestart} />;
  }

  // 提交失败:回到 Quiz 起点并提示(重新进入 P4 后可再次提交)
  // 当错误为询盘上限时,显示醒目的警示样式
  const isInquiryLimitError =
    submitError === "今日询盘次数已达上限,请明日再试";
  if (submitState === "error" && quizResult) {
    return (
      <div>
        <QuizFlow
          template={template}
          summaryTemplate={summaryTemplate}
          onComplete={handleComplete}
          styleId={styleId}
        />
        <div
          className={
            "mt-4 rounded-lg border-2 p-4 text-center " +
            (isInquiryLimitError
              ? "animate-pulse border-orange-500/60 bg-orange-50 shadow-lg shadow-orange-500/20"
              : "border-destructive/40 bg-destructive/10")
          }
        >
          <p
            className={
              isInquiryLimitError
                ? "text-base font-bold text-orange-700"
                : "text-sm font-medium text-destructive"
            }
          >
            {isInquiryLimitError && (
              <span className="mr-2 inline-block text-xl">⚠️</span>
            )}
            {submitError}
          </p>
          {isInquiryLimitError && (
            <p className="mt-2 text-xs text-orange-600">
              如需提升询盘次数上限,请联系管理员升级套餐。
            </p>
          )}
        </div>
      </div>
    );
  }

  // 问答阶段(P1 → P2 → P3 → P4)
  return (
    <QuizFlow
      template={template}
      summaryTemplate={summaryTemplate}
      onComplete={handleComplete}
      styleId={styleId}
    />
  );
}
