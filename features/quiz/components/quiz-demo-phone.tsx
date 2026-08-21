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
import { QuizFlow } from "./quiz-flow";
import type { QuizClientTemplate } from "@/lib/quiz/transform";

type QuizDemoPhoneProps = {
  template: QuizClientTemplate;
  /** 报告模板中的 Summary 摘要(subject/body),与真实 Quiz 页共用同一数据源 */
  summaryTemplate: { subject: string; body: string } | null;
};

/**
 * 主页手机框内的 Quiz 演示组件
 *
 * 与真实 Quiz 页(/quiz?t=...)复用同一 QuizFlow 组件和同一模板数据源,
 * 问卷内容与 Summary 摘要与仪表盘生成链接中的示例完全一致。
 *
 * 唯一差异:P4 点击"确定并返回开始"后不提交询盘、不发送内部告知邮件,
 * 而是通过递增 key 重挂载 QuizFlow,直接回到问卷第一步(P1)
 */
export function QuizDemoPhone({
  template,
  summaryTemplate,
}: QuizDemoPhoneProps) {
  const [restartCount, setRestartCount] = useState(0);

  return (
    // 覆盖 QuizFlow 根容器默认的整页间距,适配手机框内的紧凑布局;长内容可滚动
    // QuizFlow 在此被拉伸填满容器(flex-1),多余高度由选项行(auto-rows-fr)均匀吸收;
    // 底部预留侧边框 3 倍(6px*3=18px)的内边距,让"继续"按钮下方留白,不至于太压抑
    <div className="h-[488px] overflow-y-auto flex flex-col [&>div]:!max-w-none [&>div]:!px-4 [&>div]:!pt-4 [&>div]:!pb-[18px]">
      <QuizFlow
        key={restartCount}
        template={template}
        summaryTemplate={summaryTemplate}
        onComplete={() => setRestartCount((count) => count + 1)}
      />
    </div>
  );
}
