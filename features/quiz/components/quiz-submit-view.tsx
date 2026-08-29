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

import { motion } from "framer-motion";
import { Button } from "@/components/button";

type QuizSubmitViewProps = {
  /** 提交结果(项目编号 + 邮件发送状态) */
  result: {
    projectNumber: string;
    emailSent: boolean;
    emailError?: string | null;
  };
  /** 回到 Quiz 起点 */
  onRestart: () => void;
};

/**
 * 询盘提交结果视图
 *
 * 客户点击"返回开始"后展示:
 * - 提交成功状态
 * - 项目编号(客户名-询盘日期-询盘时间)
 * - 邮件发送状态(成功 / 失败原因)
 * - "返回开始"按钮重新开始 Quiz
 */
export function QuizSubmitView({ result, onRestart }: QuizSubmitViewProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-border bg-background p-6 sm:p-8 shadow-sm"
      >
        {/* 成功图标 */}
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10">
          <svg
            className="w-8 h-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-xl sm:text-2xl font-semibold text-foreground text-center mb-2">
          Your inquiry has been submitted
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Your request has been successfully sent to our sales team. Please keep
          your phone line open.
        </p>

        {/* 项目编号 */}
        <div className="p-4 sm:p-5 rounded-2xl border border-primary/30 bg-primary/5 mb-6">
          <p className="text-xs text-muted-foreground mb-1">Your project number</p>
          <p className="text-lg font-medium text-foreground break-all">
            {result.projectNumber}
          </p>
        </div>

        {/* 邮件发送状态 */}
        <div
          className={
            result.emailSent
              ? "p-4 sm:p-5 rounded-2xl border border-border bg-background mb-8"
              : "p-4 sm:p-5 rounded-2xl border border-destructive/30 bg-destructive/5 mb-8"
          }
        >
          <p className="text-xs text-muted-foreground mb-1">Notification email status</p>
          <p className="text-sm font-medium text-foreground">
            {result.emailSent
              ? "Sent to sales manager (cc: sales director)"
              : `Email failed to send: ${result.emailError ?? "Unknown reason"}`}
          </p>
        </div>

        {/* 返回开始 */}
        <div className="flex justify-center">
          <Button size="lg" onClick={onRestart}>
            Return to start
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
