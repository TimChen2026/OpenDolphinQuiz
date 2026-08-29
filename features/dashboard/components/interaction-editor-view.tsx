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

// Dashboard 交互界面(Phase 3 验收修订:问卷编辑器)
//
// 需求 2.1.7.1/2 + 验收报告:
// - 将问卷以手机效果展示在模块中(交互界面以手机显示效果最佳为基础设计)
// - 每个选项右方有对应的主题词输入框,供用户编辑
// - 编辑完点击右方保存按钮保存信息
// - 交互界面下方预留其他风格模板供用户选择切换,快速预览效果

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import ProgressIndicator from "@/components/ui/progress-indicator";
import type {
  DashboardTemplate,
  EditableNodeData,
} from "@/features/dashboard/types";

// 风格模板定义(name/description 为 UI 文案,走 dashboard.views.common.styles.{id}.* 翻译键)
type StyleTemplate = {
  id: string;
  available: boolean;
};

const STYLE_TEMPLATES: StyleTemplate[] = [
  { id: "classic", available: true },
  { id: "princeton", available: true },
  { id: "yale", available: true },
  { id: "stanford", available: true },
  { id: "mit", available: true },
  { id: "harvard", available: true },
  { id: "system", available: true },
];

// 各风格模板的预览样式配置
type PreviewStyle = {
  pageBg: string;
  cardBg: string;
  accent: string;
  text: string;
  muted: string;
  border: string;
  fontFamily: string;
  btnBg: string;
  btnText: string;
  optionBg: string;
  radioBorder: string;
  progressTrack: string;
};

const PREVIEW_STYLES: Record<string, PreviewStyle> = {
  // Oxford 深蓝(系统主题色):注意 globals.css 中变量为原始 HSL 值(如 "218 74% 15%"),
  // 直接写 var(--primary) 会被解析为无效 CSS 导致颜色透明,必须用 hsl(var(--xxx)) 包裹
  // 进度条颜色已按需求硬编码为指定色值,不随系统主题变量变化
  classic: {
    pageBg: "transparent",
    cardBg: "hsl(var(--card))",
    accent: "rgb(197, 164, 89)",
    text: "hsl(var(--foreground))",
    muted: "hsl(var(--muted-foreground))",
    border: "hsl(var(--border))",
    fontFamily: "inherit",
    btnBg: "hsl(var(--primary))",
    btnText: "hsl(var(--primary-foreground))",
    optionBg: "hsl(var(--background))",
    radioBorder: "hsl(var(--border))",
    progressTrack: "rgb(240, 237, 229)",
  },
  // Princeton: 暖橙(#E98338) + 深黑文字, Georgia 衬线字体, 暖米色背景
  princeton: {
    pageBg: "#FAF8F5",
    cardBg: "#FFFFFF",
    accent: "#E98338",
    text: "#1A1A1A",
    muted: "#6B6B6B",
    border: "#E5DDD3",
    fontFamily: "Georgia, 'Noto Serif SC', serif",
    btnBg: "#1A1A1A",
    btnText: "#FFFFFF",
    optionBg: "#FAF6F1",
    radioBorder: "#1A1A1A",
    progressTrack: "#E5DDD3",
  },
  // Yale: 耶鲁深蓝(#00356B) + 灰色辅色, Georgia 衬线字体, 纯白背景
  yale: {
    pageBg: "#FFFFFF",
    cardBg: "#FFFFFF",
    accent: "#00356B",
    text: "#1A1A1A",
    muted: "#4A4A4A",
    border: "#E0E0E0",
    fontFamily: "Georgia, 'Noto Serif SC', serif",
    btnBg: "#00356B",
    btnText: "#FFFFFF",
    optionBg: "#F5F5F5",
    radioBorder: "#00356B",
    progressTrack: "#E0E0E0",
  },
  // Stanford: 斯坦福红(#8C1515) + 暖灰底, system-ui 无衬线, 加州现代
  stanford: {
    pageBg: "#FDFBF7",
    cardBg: "#FFFFFF",
    accent: "#8C1515",
    text: "#2E2D29",
    muted: "#585751",
    border: "#E8E4DD",
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    btnBg: "#8C1515",
    btnText: "#FFFFFF",
    optionBg: "#FAF7F2",
    radioBorder: "#8C1515",
    progressTrack: "#E8E4DD",
  },
  // MIT: MIT 红(#A31F34) + 银灰辅色, Helvetica 无衬线, 极简技术风
  mit: {
    pageBg: "#F5F5F5",
    cardBg: "#FFFFFF",
    accent: "#A31F34",
    text: "#1A1A1A",
    muted: "#666666",
    border: "#DDDDDD",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    btnBg: "#A31F34",
    btnText: "#FFFFFF",
    optionBg: "#F0F0F0",
    radioBorder: "#A31F34",
    progressTrack: "#DDDDDD",
  },
  // Harvard: 哈佛深红(#A51C30) + 黑白经典, Palatino 衬线, 传统名校
  harvard: {
    pageBg: "#FFFFFF",
    cardBg: "#FFFFFF",
    accent: "#A51C30",
    text: "#1E1E1E",
    muted: "#555555",
    border: "#E0E0E0",
    fontFamily: "'Palatino', Georgia, 'Noto Serif SC', serif",
    btnBg: "#A51C30",
    btnText: "#FFFFFF",
    optionBg: "#F8F8F8",
    radioBorder: "#A51C30",
    progressTrack: "#E0E0E0",
  },
};

// 跟随系统 - 深色模式样式(当 OS 处于 dark mode 时使用)
const SYSTEM_DARK_STYLE: PreviewStyle = {
  pageBg: "#0F172A",
  cardBg: "#1E293B",
  accent: "#60A5FA",
  text: "#F1F5F9",
  muted: "#94A3B8",
  border: "#334155",
  fontFamily: "inherit",
  btnBg: "#3B82F6",
  btnText: "#FFFFFF",
  optionBg: "#0F172A",
  radioBorder: "#64748B",
  progressTrack: "#334155",
};

export function InteractionEditorView({
  selectedNodeId,
  onSelectNode,
}: {
  // 当前选中节点 id(受控:与逻辑界面节点图联动,由 DashboardShell 统一管理)
  selectedNodeId: string;
  onSelectNode: (id: string) => void;
}) {
  const [template, setTemplate] = useState<DashboardTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("classic");
  // 风格保存状态(点击「确定」后保存到 sessionStorage,供链接生成与 Quiz 问卷读取)
  const [styleSaved, setStyleSaved] = useState(false);
  const [savingStyle, setSavingStyle] = useState(false);
  const t = useTranslations("dashboard.views.editor");
  const tc = useTranslations("dashboard.views.common");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/template");
      if (!res.ok) {
        throw new Error(tc("loadFailed"));
      }
      const json = (await res.json()) as { template: DashboardTemplate };
      setTemplate(json.template);
      // 恢复已保存的风格(供链接生成使用)
      if (typeof window !== "undefined") {
        const saved = window.sessionStorage.getItem(
          "dolphin_quiz_style"
        );
        if (saved && STYLE_TEMPLATES.some((s) => s.id === saved)) {
          setSelectedStyle(saved);
          setStyleSaved(true);
        }
      }
    } catch {
      setSaveError(t("loadTemplatesFailed"));
    } finally {
      setLoading(false);
    }
  }, [t, tc]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 首次加载完成后,若无默认选中,则默认选中根节点(P1)
  useEffect(() => {
    if (loading || !template?.nodes || selectedNodeId) {
      return;
    }
    const root =
      template.nodes.find((n) => n.parentId === null) ?? template.nodes[0];
    if (root) {
      onSelectNode(root.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, template, selectedNodeId]);

  /** 内容编辑:跳转逻辑界面(与仪表盘点击「逻辑界面」菜单一致),滚动到节点结构编辑区 */
  const handleGoEdit = useCallback(() => {
    const scrollToLogic = () => {
      const section = document.getElementById("logic-section");
      if (!section) {
        return;
      }
      // -96px = 顶部导航高度,与 logic-section 的 scroll-mt-24 一致,避免区块标题被遮挡
      const top = section.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    };
    scrollToLogic();
    // 逻辑区块内容加载后位置可能偏移,延迟再定位一次
    window.setTimeout(scrollToLogic, 1200);
  }, []);

  /** 更新选项主题词 */
  const updateOptionTheme = (nodeId: string, optionId: string, theme: string) => {
    setTemplate((prev) =>
      prev
        ? {
            ...prev,
            nodes:
              prev.nodes?.map((n) =>
                n.id === nodeId
                  ? {
                      ...n,
                      options: n.options.map((o) =>
                        o.id === optionId ? { ...o, resultTheme: theme } : o
                      ),
                    }
                  : n
              ) ?? null,
          }
        : prev
    );
  };

  /** 确定:保存选中风格到 sessionStorage,供链接生成与 Quiz 问卷使用 */
  const handleConfirmStyle = useCallback(() => {
    setSavingStyle(true);
    try {
      // 将选定的风格写入 sessionStorage(键名 dolphin_quiz_style),
      // 链接生成模块会读取该值并附加到 Quiz 链接,Quiz 页据此渲染对应风格
      window.sessionStorage.setItem("dolphin_quiz_style", selectedStyle);
      setStyleSaved(true);
    } catch {
      setStyleSaved(false);
    } finally {
      setSavingStyle(false);
    }
  }, [selectedStyle]);

  /** 保存当前节点的选项主题词 */
  const handleSave = async () => {
    if (!template || !selectedNodeId) {
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);
    try {
      const nodes = (template.nodes ?? [])
        .filter((n) => n.id === selectedNodeId)
        .map((n) => ({ id: n.id, question: n.question }));
      const options = (template.nodes ?? [])
        .flatMap((n) => n.options)
        .map((o) => ({
          id: o.id,
          optionText: o.optionText,
          targetNodeId: o.targetNodeId,
          resultTheme: o.resultTheme,
          resultManagerId: o.resultManagerId,
        }));

      const res = await fetch("/api/dashboard/template/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id, nodes, options }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error ?? tc("saveFailed"));
      }
      setSaveMessage(t("saved"));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t("saveFailedRetry"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        {tc("loading")}
      </div>
    );
  }

  if (!template || !template.nodes) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        {tc("noTemplates")}
      </div>
    );
  }

  const selectedNode =
    template.nodes.find((n) => n.id === selectedNodeId) ?? template.nodes[0];

  return (
    <div className="space-y-6">
      {/* 手机预览 + 主题词编辑 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 手机问卷预览 */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-foreground">
            {t("previewTitle")}
          </h3>
          <MobilePreview node={selectedNode} styleId={selectedStyle} />
        </div>

        {/* 主题词输入 */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-foreground">
            {t("themeEditTitle")}
          </h3>
          <div className="space-y-3">
            {selectedNode.options.map((option) => (
              <div
                key={option.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
              >
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {option.optionLabel}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">
                    {option.optionText}
                  </p>
                </div>
                <input
                  value={option.resultTheme ?? ""}
                  onChange={(e) =>
                    updateOptionTheme(selectedNode.id, option.id, e.target.value)
                  }
                  placeholder={t("themePlaceholder")}
                  className="w-32 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
            ))}
            {selectedNode.options.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t("noOptionsHint")}
              </p>
            )}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? tc("saving") : tc("save")}
            </Button>
            {saveMessage && (
              <span className="text-sm text-green-600">{saveMessage}</span>
            )}
            {saveError && (
              <span className="text-sm text-destructive">{saveError}</span>
            )}
          </div>
        </div>
      </div>

      {/* 节点选择器(原第 1 个子元素,调整为第 2 个) */}
      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-foreground">
            {t("selectNodeByOption")}
          </label>
          <select
            value={selectedNode.id}
            onChange={(e) => onSelectNode(e.target.value)}
            className="flex-1 min-w-48 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
          >
            {template.nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.level} {n.question}
              </option>
            ))}
          </select>
        </div>
        {/* 内容编辑:跳转逻辑界面,效果与点击仪表盘「逻辑界面」菜单一致 */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleGoEdit}>
            {t("goEdit")}
          </Button>
          <span className="text-xs text-muted-foreground">
            {t("goEditHint")}
          </span>
        </div>
      </div>

      {/* 风格模板选择(快速预览) */}
      <div className="rounded-2xl border border-border bg-background p-5">
        <h3 className="font-semibold text-foreground">{t("styleTemplates")}</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STYLE_TEMPLATES.map((style) => (
            <button
              key={style.id}
              type="button"
              disabled={!style.available}
              onClick={() => setSelectedStyle(style.id)}
              className={cn(
                "rounded-2xl border p-4 text-left transition",
                selectedStyle === style.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40",
                !style.available && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {tc(`styles.${style.id}.name`)}
                </span>
                {!style.available && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {t("comingSoon")}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {tc(`styles.${style.id}.description`)}
              </p>
            </button>
          ))}
        </div>

        {/* 确定:保存选定风格到 sessionStorage,供链接生成与 Quiz 问卷使用 */}
        <div className="mt-4 flex items-center gap-3">
          <Button
            onClick={handleConfirmStyle}
            disabled={savingStyle}
          >
            {savingStyle ? tc("saving") : tc("confirm")}
          </Button>
          {styleSaved ? (
            <span className="text-sm text-green-600">
              {t("styleSaved", { name: tc(`styles.${selectedStyle}.name`) })}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {t("styleApplyHint")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 检测操作系统深浅色模式偏好
 */
function useSystemDark(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    // 挂载时同步一次系统主题初始值,事件监听仅负责后续变化,一次性同步豁免校验
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isDark;
}

/**
 * 手机问卷预览(参考首页 Quiz 样品卡片样式)
 * 支持多种风格模板切换,各模板有独立的配色和字体
 */
function MobilePreview({
  node,
  styleId,
}: {
  node: EditableNodeData;
  styleId: string;
}) {
  const t = useTranslations("dashboard.views.editor");
  const isSystemDark = useSystemDark();

  // 跟随系统:根据 OS 深浅色偏好选择样式
  const activeStyleId =
    styleId === "system"
      ? isSystemDark
        ? "__system_dark__"
        : "classic"
      : styleId;

  // 获取当前风格配置
  const s: PreviewStyle =
    activeStyleId === "__system_dark__"
      ? SYSTEM_DARK_STYLE
      : PREVIEW_STYLES[activeStyleId] ?? PREVIEW_STYLES.classic;

  return (
    <div
      className="mx-auto w-full max-w-xs rounded-2xl border shadow-lg"
      style={{
        background: s.cardBg,
        borderColor: s.border,
        fontFamily: s.fontFamily,
      }}
    >
      {/* 问题(进度指示器在 DOM 顺序变更中已移至卡片底部,此处为卡片首个子元素) */}
      <div className="px-6 pt-6 pb-2">
        <h3
          className="text-base font-semibold leading-snug"
          style={{ color: s.text, fontFamily: s.fontFamily }}
        >
          {node.question}
        </h3>
      </div>

      {/* 选项列表 */}
      <div className="px-6 pb-4 space-y-2.5">
        {node.options.map((option) => (
          <div
            key={option.id}
            className="flex items-center gap-3 p-3 rounded-lg border"
            style={{
              background: s.optionBg,
              borderColor: s.border,
            }}
          >
            <div
              className="w-5 h-5 rounded-full border-2 flex-shrink-0"
              style={{ borderColor: s.radioBorder }}
            />
            <span className="text-sm" style={{ color: s.muted }}>
              {option.optionLabel}. {option.optionText}
            </span>
          </div>
        ))}
        {node.options.length === 0 && (
          <div
            className="py-6 text-center text-sm"
            style={{ color: s.muted }}
          >
            {t("summaryPage")}
          </div>
        )}
      </div>

      {/* 进度指示器 + 操作按钮(整体替换原顶部进度条与底部继续按钮,置于卡片底部)
          step 按节点等级映射:P1=1 / P2=2 / P3=3 / P4(结果页)=3 保持满格;
          P1 仅显示「继续」,P2/P3/P4 额外显示「返回」
          配色沿用原进度条 s.progressTrack(轨道)/ s.accent(填充)与 s.btnBg/s.btnText(按钮) */}
      <div className="px-6 pb-6">
        <ProgressIndicator
          step={
            node.level === "P1"
              ? 1
              : node.level === "P2"
                ? 2
                : /* P3 与 P4 结果页均映射到满格步骤 3 */ 3
          }
          isExpanded={node.level === "P1"}
          accent={s.accent}
          track={s.progressTrack}
          btnBg={s.btnBg}
          btnText={s.btnText}
        />
      </div>
    </div>
  );
}
