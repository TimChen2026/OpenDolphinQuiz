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

import { useState, useCallback, useMemo, type CSSProperties, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ProgressIndicator from "@/components/ui/progress-indicator";
import { useSession } from "@/lib/auth-client";
import type {
  QuizClientTemplate,
  QuizClientOption,
  QuizResult,
  QuizPathEntry,
} from "@/lib/quiz/transform";

type QuizFlowProps = {
  template: QuizClientTemplate;
  /** 报告模板中的 Summary 摘要(subject/body,含 @变量,决定 Summary 页内容) */
  summaryTemplate: { subject: string; body: string } | null;
  /** P4 结果页点击"返回开始"时回调(提交询盘) */
  onComplete: (result: QuizResult) => void;
  /** 选定风格 ID(如 classic/princeton/yale 等),为空时使用系统默认主题 */
  styleId?: string;
};

/**
 * 各风格对应的 CSS 变量覆盖
 * 参考交互界面 MobilePreview 的 PREVIEW_STYLES 定义,将配色映射为 Tailwind CSS 变量
 *
 * 注意:本项目 Tailwind 颜色通过 hsl(var(--primary)) 形式使用(tailwind.config.ts),
 * 因此变量值必须是「原始 HSL 值」格式(如 "25 80% 57%"),不能写 hex(如 "#E98338"),
 * 否则 hsl(#E98338) 为无效 CSS,颜色不会生效。
 */
type QuizStyleConfig = {
  /** Tailwind CSS 变量覆盖(值为原始 HSL 值,不带 hsl() 包裹) */
  vars: Record<string, string>;
  /** 风格专属字体(可选,与手机预览一致) */
  fontFamily?: string;
};

const QUIZ_STYLE_VARS: Record<string, QuizStyleConfig> = {
  classic: { vars: {} },
  // Princeton: 暖橙强调(#E98338) + 黑色主按钮 + Georgia 衬线, 暖米色背景
  princeton: {
    vars: {
      "--primary": "0 0% 10%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "25 80% 57%",
      "--background": "36 33% 97%",
      "--card": "0 0% 100%",
      "--foreground": "0 0% 10%",
      "--muted-foreground": "0 0% 42%",
      "--muted": "33 26% 86%",
      "--border": "33 26% 86%",
    },
    fontFamily: "Georgia, 'Noto Serif SC', serif",
  },
  // Yale: 耶鲁深蓝(#00356B) + 灰色辅色, Georgia 衬线, 纯白背景
  yale: {
    vars: {
      "--primary": "210 100% 21%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "210 100% 21%",
      "--background": "0 0% 100%",
      "--card": "0 0% 100%",
      "--foreground": "0 0% 10%",
      "--muted-foreground": "0 0% 29%",
      "--muted": "0 0% 88%",
      "--border": "0 0% 88%",
    },
    fontFamily: "Georgia, 'Noto Serif SC', serif",
  },
  // Stanford: 斯坦福红(#8C1515) + 暖灰底, system-ui 无衬线, 加州现代
  stanford: {
    vars: {
      "--primary": "0 74% 32%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "0 74% 32%",
      "--background": "40 60% 98%",
      "--card": "0 0% 100%",
      "--foreground": "48 6% 17%",
      "--muted-foreground": "51 4% 33%",
      "--muted": "38 19% 89%",
      "--border": "38 19% 89%",
    },
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  // MIT: MIT 红(#A31F34) + 银灰辅色, Helvetica 无衬线, 极简技术风
  mit: {
    vars: {
      "--primary": "350 68% 38%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "350 68% 38%",
      "--background": "0 0% 96%",
      "--card": "0 0% 100%",
      "--foreground": "0 0% 10%",
      "--muted-foreground": "0 0% 40%",
      "--muted": "0 0% 87%",
      "--border": "0 0% 87%",
    },
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },
  // Harvard: 哈佛深红(#A51C30) + 黑白经典, Palatino 衬线, 传统名校
  harvard: {
    vars: {
      "--primary": "351 71% 38%",
      "--primary-foreground": "0 0% 100%",
      "--accent": "351 71% 38%",
      "--background": "0 0% 100%",
      "--card": "0 0% 100%",
      "--foreground": "0 0% 12%",
      "--muted-foreground": "0 0% 33%",
      "--muted": "0 0% 88%",
      "--border": "0 0% 88%",
    },
    fontFamily: "'Palatino', Georgia, 'Noto Serif SC', serif",
  },
  system: { vars: {} },
};

// 各风格的进度指示器配色(与仪表盘交互界面 MobilePreview 的 PREVIEW_STYLES 保持一致)
// accent=进度填充色、track=未激活圆点颜色
// 注:必须用真实色值(hex/rgb),不能写成 var(--xxx) 或原始 HSL 字符串,
//    否则 hsl(var(...)) 无法解析为合法颜色,进度条会显示异常。
const QUIZ_PROGRESS_COLORS: Record<string, { accent: string; track: string }> = {
  classic: { accent: "rgb(197, 164, 89)", track: "rgb(240, 237, 229)" },
  princeton: { accent: "#E98338", track: "#E5DDD3" },
  yale: { accent: "#00356B", track: "#E0E0E0" },
  stanford: { accent: "#8C1515", track: "#E8E4DD" },
  mit: { accent: "#A31F34", track: "#DDDDDD" },
  harvard: { accent: "#A51C30", track: "#E0E0E0" },
  // 跟随系统:浅色模式下复用 classic(Oxford 深蓝)样式配置
  system: { accent: "rgb(197, 164, 89)", track: "rgb(240, 237, 229)" },
};

// Summary 模板渲染时的变量替换
function renderTemplate(text: string, vars: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(`@${key}`).join(value ?? "");
  }
  return result;
}

/**
 * Quiz 问答流程组件
 *
 * 流转:P1 → P2 → P3 → P4(结果层)
 * - P1/P2/P3:显示问题 + 4 个选项,选中后高亮,点击"继续"跳转下一节点
 * - P4:展示报告模板 summary 摘要渲染后的内容 + "返回开始"按钮(提交询盘)
 * - 进度指示器为新版圆点样式(与仪表盘手机预览保持一致,纯视觉,不含按钮)
 */
export function QuizFlow({
  template,
  summaryTemplate,
  onComplete,
  styleId,
}: QuizFlowProps) {
  const session = useSession();
  const [currentNodeId, setCurrentNodeId] = useState(template.rootNodeId);
  const [path, setPath] = useState<QuizPathEntry[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  // P3 选项的关联结果(主题/经理),P4 返回开始时提交
  const [pendingResult, setPendingResult] = useState<
    Pick<QuizResult, "theme" | "managerId"> | null
  >(null);

  // 当前风格对应的 CSS 变量覆盖 + 专属字体(与手机预览一致)
  const styleConfig = styleId ? QUIZ_STYLE_VARS[styleId] : undefined;
  const styleVars = {
    ...(styleConfig?.vars ?? {}),
    ...(styleConfig?.fontFamily
      ? { fontFamily: styleConfig.fontFamily }
      : {}),
  } as CSSProperties;

  const currentNode = template.nodes[currentNodeId];
  const isResultNode = currentNode.level === "P4";

  // 当前进度步骤:P1=1 P2=2 P3=3 P4(结果页)=3 保持满格(与仪表盘手机预览一致)
  const progressStep = useMemo(() => {
    const order: Record<string, number> = { P1: 1, P2: 2, P3: 3, P4: 3 };
    return order[currentNode.level] ?? 1;
  }, [currentNode.level]);

  // 当前风格的进度指示器配色(与仪表盘 PREVIEW_STYLES 一致),未知风格统一回退 classic
  const progressColors =
    QUIZ_PROGRESS_COLORS[styleId ?? "classic"] ?? QUIZ_PROGRESS_COLORS.classic;

  /** 选择选项(高亮) */
  const handleSelectOption = useCallback((optionId: string) => {
    setSelectedOptionId(optionId);
  }, []);

  /** 点击"继续":记录路径并跳转下一节点 */
  const handleContinue = useCallback(() => {
    if (!currentNode || !selectedOptionId) {
      return;
    }
    const option = currentNode.options.find((o) => o.id === selectedOptionId);
    if (!option) {
      return;
    }

    // 记录当前选择到路径
    const entry: QuizPathEntry = {
      nodeId: currentNode.id,
      nodeLevel: currentNode.level as "P1" | "P2" | "P3",
      nodeQuestion: currentNode.question,
      optionId: option.id,
      optionLabel: option.label,
      optionText: option.text,
    };
    const newPath = [...path, entry];

    if (option.targetNodeId === null) {
      // 理论不会发生(P3 选项均指向 P4),兜底直接完成
      onComplete({ theme: option.resultTheme, managerId: option.resultManagerId, path: newPath });
      return;
    }

    const target = template.nodes[option.targetNodeId];
    if (!target) {
      return;
    }

    if (target.level === "P4") {
      // 进入 P4 结果层:暂存主题/经理,等待"返回开始"提交
      setPendingResult({
        theme: option.resultTheme,
        managerId: option.resultManagerId,
      });
    }

    setPath(newPath);
    setSelectedOptionId(null);
    setCurrentNodeId(option.targetNodeId);
  }, [currentNode, selectedOptionId, path, template.nodes, onComplete]);

  /** P4 页点击"返回开始":提交询盘 */
  const handleSubmitResult = useCallback(() => {
    onComplete({
      theme: pendingResult?.theme ?? null,
      managerId: pendingResult?.managerId ?? null,
      path,
    });
  }, [pendingResult, path, onComplete]);

  return (
    <div
      className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12 flex flex-col flex-1"
      style={styleVars as CSSProperties}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentNode.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="mt-8 flex flex-col flex-1"
        >
          {isResultNode ? (
            <ResultSummary
              summaryTemplate={summaryTemplate}
              path={path}
              theme={pendingResult?.theme ?? null}
              customerName={session.data?.user?.name ?? ""}
              customerEmail={session.data?.user?.email ?? ""}
              onSubmit={handleSubmitResult}
              progress={
                /* P4 结果页进度指示器:满格步骤 3,置于摘要下方、提交按钮上方,与答题页位置一致 */
                <ProgressIndicator
                  step={3}
                  showButtons={false}
                  accent={progressColors.accent}
                  track={progressColors.track}
                />
              }
            />
          ) : (
            <>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-6 text-center">
                {currentNode.question}
              </h2>

              <div className="grid gap-3 sm:gap-4 flex-1 auto-rows-fr">
                {currentNode.options.map((option) => (
                  <OptionButton
                    key={option.id}
                    option={option}
                    selected={selectedOptionId === option.id}
                    onClick={() => handleSelectOption(option.id)}
                  />
                ))}
              </div>

              {/* 进度指示器(纯视觉,位于选项菜单下方、继续按钮上方,居中展示;
                  配色取当前风格真实色值,与仪表盘交互界面手机预览一一对应) */}
              <div className="mt-6">
                <ProgressIndicator
                  step={progressStep}
                  showButtons={false}
                  accent={progressColors.accent}
                  track={progressColors.track}
                />
              </div>

              {/* 继续按钮:选中选项后出现 */}
              <button
                type="button"
                disabled={!selectedOptionId}
                onClick={handleContinue}
                className={cn(
                  "w-full py-3 rounded-lg text-sm font-semibold transition-all mt-6",
                  selectedOptionId
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                继续
              </button>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * 选项按钮(radio 单选样式,参考首页样品)
 * 选中时高亮:border-accent bg-muted + 内圆点 bg-accent
 */
function OptionButton({
  option,
  selected,
  onClick,
}: {
  option: QuizClientOption;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all text-left",
        selected ? "border-accent bg-muted" : "border-border hover:border-accent/50"
      )}
    >
      <div
        className={cn(
          "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
          selected ? "border-accent" : "border-border"
        )}
      >
        {selected && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
      </div>
      <span
        className={cn(
          "text-sm",
          selected ? "font-medium text-foreground" : "text-muted-foreground"
        )}
      >
        {option.label}. {option.text}
      </span>
    </button>
  );
}

/**
 * P4 结果层:展示报告模板 summary 摘要渲染内容 + "返回开始"按钮
 */
function ResultSummary({
  summaryTemplate,
  path,
  theme,
  customerName,
  customerEmail,
  onSubmit,
  progress,
}: {
  summaryTemplate: { subject: string; body: string } | null;
  path: QuizPathEntry[];
  theme: string | null;
  customerName: string;
  customerEmail: string;
  onSubmit: () => void;
  /** 进度指示器(纯视觉),渲染于摘要正文与提交按钮之间,与答题页位置一致 */
  progress?: ReactNode;
}) {
  // 选择路径摘要
  const pathSummary = path
    .map(
      (entry) =>
        `[${entry.nodeLevel}] ${entry.nodeQuestion} → ${entry.optionLabel}:${entry.optionText}`
    )
    .join("\n");

  // 渲染 summary 模板变量
  const vars: Record<string, string> = {
    主题: theme ?? "",
    选择路径: pathSummary,
    客户名: customerName,
    客户邮箱: customerEmail,
    客户电话: "",
    用户: "DolphinQuiz",
    项目编号: "",
  };

  const subject = summaryTemplate
    ? renderTemplate(summaryTemplate.subject, vars)
    : "Quiz 结果摘要";
  const body = summaryTemplate
    ? renderTemplate(summaryTemplate.body, vars)
    : `感谢您完成 Quiz 问卷!\n\n选择路径:\n${pathSummary}\n\n关联主题:${theme ?? "-"}\n\nDolphinQuiz 团队`;

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-foreground text-center mb-8">
        {subject}
      </h1>

      {/* 摘要正文(保留换行) */}
      <div className="p-5 sm:p-6 rounded-2xl border border-border bg-background mb-6 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {body}
      </div>

      {/* 进度指示器:摘要下方、提交按钮上方,居中(与答题页位置一致) */}
      {progress && <div className="mb-6">{progress}</div>}

      {/* 返回开始按钮(提交询盘) */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onSubmit}
          className="w-full max-w-xs py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90 bg-primary text-primary-foreground"
        >
          确定并返回开始
        </button>
      </div>
    </div>
  );
}
