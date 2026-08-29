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

// Dashboard 逻辑界面 - 节点图 + 输入表格(Phase 3 验收修订)
//
// 需求 2.1.7.2 + 验收报告 c.1/c.2:
// - 使用 ECharts tree 渲染 Quiz 决策树(P1/P2/P3/P4 节点,附件3 含 P4)
// - 逻辑界面与输入表格共用右侧:逻辑界面排列在上,可滑动向下看到输入表格
// - 逻辑界面的节点与输入表格对应项关联:点击节点后,下方展示该节点内容供编辑
// - 输入表格与交互界面关联:表格下方给出选项框与显示按钮,选择 P3 节点点击"显示",
//   展示该 P3 节点 Quiz 问卷效果(参考交互界面手机效果)

import { useCallback, useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import type { ECElementEvent } from "echarts";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import type {
  EditableNodeData,
  DashboardTemplate,
} from "@/features/dashboard/types";

// 层级颜色映射(含 P4 结果层)
const LEVEL_COLORS: Record<string, string> = {
  P1: "#2563eb", // 蓝
  P2: "#ea580c", // 橙
  P3: "#16a34a", // 绿
  P4: "#7c3aed", // 紫
};

/**
 * P4 结果节点的内容从父级(P3)选项文本派生:
 * 运行时结果页展示的是答题路径上的选项文本,并不展示 P4 的 question 字段,
 * 因此编辑器对 P4 只读展示父级选项文本,避免用户重复输入;
 * 找不到父选项时回退节点自身 question
 */
function getParentOptionText(
  nodes: EditableNodeData[],
  node: EditableNodeData
): string {
  if (node.parentId) {
    const parent = nodes.find((n) => n.id === node.parentId);
    const incomingEdge = parent?.options.find(
      (o) => o.targetNodeId === node.id
    );
    if (incomingEdge && incomingEdge.optionText.trim()) {
      return incomingEdge.optionText;
    }
  }
  return node.question;
}

// 递归构建 ECharts tree 数据
function buildTreeData(
  nodes: EditableNodeData[],
  nodeId: string
): {
  name: string;
  itemStyle?: { color: string };
  nodeId: string;
  children?: ReturnType<typeof buildTreeData>[];
} {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) {
    return { name: "?", nodeId: "" };
  }

  // 查找子节点(通过选项的 targetNodeId)
  const children: ReturnType<typeof buildTreeData>[] = [];
  for (const option of node.options) {
    if (!option.targetNodeId) {
      continue; // P4 结果节点无子节点
    }
    const child = buildTreeData(nodes, option.targetNodeId);
    // 将选项文本拼入子节点名
    child.name = `[${option.optionLabel}] ${child.name}`;
    children.push(child);
  }

  // P4 结果为叶子,其内容由父级(P3)选项文本派生,故决策树叶子展示派生文本而非 question
  const label =
    node.level === "P4" ? getParentOptionText(nodes, node) : node.question;

  return {
    name: `${node.level} ${label}`,
    itemStyle: { color: LEVEL_COLORS[node.level] ?? "#64748b" },
    nodeId: node.id,
    ...(children.length > 0 ? { children } : {}),
  };
}

/**
 * 校验问卷模板内容是否完整(返回遗漏/问题清单,无则返回空数组)
 * - 节点问题文本不能为空
 * - 选项文本不能为空
 * - P1~P3 决策节点的每个选项必须连接到下一节点(targetNodeId),否则决策树中断
 * - P1~P3 决策节点必须有至少一个选项
 * - 校验消息为 UI 文案,经传入的翻译函数 t 生成(键:dashboard.views.logic.check.*)
 */
function validateTemplate(
  template: DashboardTemplate | null,
  t: ReturnType<typeof useTranslations>
): string[] {
  if (!template || !template.nodes || template.nodes.length === 0) {
    return [t("check.noNodes")];
  }
  const issues: string[] = [];
  for (const node of template.nodes) {
    // P4 结果节点内容由父级选项派生且编辑器只读,跳过问题文本与选项校验
    if (node.level === "P4") {
      continue;
    }
    const label = t("check.nodeLabel", {
      level: node.level,
      question: node.question.trim() || t("check.noQuestion"),
    });
    if (!node.question.trim()) {
      issues.push(t("check.questionEmpty", { label }));
    }
    if (node.options.length === 0) {
      issues.push(t("check.noOptions", { label }));
    }
    for (const opt of node.options) {
      const optionLabel = opt.optionLabel || "?";
      if (!opt.optionText.trim()) {
        issues.push(t("check.optionEmpty", { label, optionLabel }));
      }
      if (node.level !== "P4" && !opt.targetNodeId) {
        issues.push(
          t("check.optionNotConnected", {
            label,
            optionLabel,
            optionText: opt.optionText.trim() || "?",
          })
        );
      }
    }
  }
  return issues;
}

export function LogicView({
  selectedNodeId,
  onSelectNode,
}: {
  // 当前选中节点 id(与交互界面「i.通过选项选择节点」共享,由 DashboardShell 统一管理)
  selectedNodeId: string;
  onSelectNode: (id: string) => void;
}) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  // 自动保存防抖定时器
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 始终指向最新 template,供防抖回调读取
  const templateRef = useRef<DashboardTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<DashboardTemplate | null>(null);
  // 预览的 P3 节点(表格下方显示其 Quiz 效果)
  const [previewNodeId, setPreviewNodeId] = useState<string>("");
  // 保存状态
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  // 自动保存状态提示("已自动保存"/"自动保存失败")
  const [autoSaveStatus, setAutoSaveStatus] = useState<string | null>(null);
  // 检查结果(null=尚未检查; 空数组=通过; 非空=遗漏清单)
  const [checkResult, setCheckResult] = useState<string[] | null>(null);
  const t = useTranslations("dashboard.views.logic");
  const tc = useTranslations("dashboard.views.common");

  const renderChart = useCallback((template: DashboardTemplate) => {
    const container = chartRef.current;
    if (!container || !template.nodes || template.nodes.length === 0) {
      return;
    }

    // 找到根节点(parentId 为 null)
    const rootNode = template.nodes.find((n) => n.parentId === null);
    if (!rootNode) {
      return;
    }

    const treeData = buildTreeData(template.nodes, rootNode.id);

    const chart = chartInstanceRef.current ?? echarts.init(container);
    chartInstanceRef.current = chart;

    chart.setOption({
      tooltip: {
        trigger: "item",
        triggerOn: "mousemove",
        formatter: (params: { name: string }) => params.name,
      },
      series: [
        {
          type: "tree",
          data: [treeData],
          top: "5%",
          left: "5%",
          bottom: "5%",
          right: "15%",
          // 节点较多时树宽超出容器,开启拖拽平移:按住图表左右拖动查看全部节点;
          // 仅启用 move 不启用滚轮缩放,避免劫持嵌在长页面中的页面滚动
          roam: "move",
          symbol: "circle",
          symbolSize: 10,
          initialTreeDepth: 2,
          expandAndCollapse: true,
          label: {
            position: "left",
            verticalAlign: "middle",
            align: "right",
            fontSize: 12,
            formatter: (params: { name: string }) => {
              // 截断过长文本
              return params.name.length > 24
                ? params.name.slice(0, 24) + "..."
                : params.name;
            },
          },
          leaves: {
            label: {
              position: "right",
              verticalAlign: "middle",
              align: "left",
            },
          },
          emphasis: {
            focus: "descendant",
          },
          lineStyle: { color: "#94a3b8" },
        },
      ],
    });

    // 点击节点 → 选中该节点(通知上层统一更新选中态,
    // 使「节点内容编辑表格」与交互界面的手机预览/主题词/下拉框同步联动)
    chart.off("click");
    chart.on("click", (params: ECElementEvent) => {
      const data = params.data as { nodeId?: string } | null;
      const nodeId = data?.nodeId;
      if (nodeId) {
        onSelectNode(nodeId);
      }
    });

    // 窗口变化自适应
    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/dashboard/template");
        if (!res.ok) {
          throw new Error(tc("loadFailed"));
        }
        const json = (await res.json()) as { template: DashboardTemplate };
        if (!cancelled) {
          setTemplate(json.template);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError(t("loadChartFailed"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      cleanupRef.current?.();
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, [t, tc]);

  // 数据加载完成且图表容器挂载后再渲染 ECharts
  useEffect(() => {
    if (loading || !template) {
      return;
    }
    cleanupRef.current = renderChart(template) ?? null;
    return () => {
      cleanupRef.current?.();
    };
  }, [loading, template, renderChart]);

  // 保持 templateRef 指向最新 template,供防抖自动保存读取
  useEffect(() => {
    templateRef.current = template;
  }, [template]);

  // 组件卸载时清理自动保存定时器
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, []);

  /** 更新节点问题(并触发自动保存) */
  const updateNodeQuestion = (nodeId: string, question: string) => {
    setTemplate((prev) =>
      prev
        ? {
            ...prev,
            nodes:
              prev.nodes?.map((n) =>
                n.id === nodeId ? { ...n, question } : n
              ) ?? null,
          }
        : prev
    );
    scheduleAutoSave();
  };

  /** 更新选项文本(并触发自动保存) */
  const updateOptionText = (
    nodeId: string,
    optionId: string,
    text: string
  ) => {
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
                        o.id === optionId ? { ...o, optionText: text } : o
                      ),
                    }
                  : n
              ) ?? null,
          }
        : prev
    );
    scheduleAutoSave();
  };

  /** 将当前 template 的最新内容写入数据库 */
  const persistTemplate = useCallback(async (): Promise<void> => {
    const current = templateRef.current;
    if (!current) {
      return;
    }
    const nodes = (current.nodes ?? []).map((n) => ({
      id: n.id,
      question: n.question,
    }));
    const options = (current.nodes ?? [])
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
      body: JSON.stringify({
        templateId: current.id,
        nodes,
        options,
      }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.error ?? tc("saveFailed"));
    }
  }, [tc]);

  /**
   * 编排自动保存:防抖 1.2s,期间不断编辑则不断重置定时器;
   * 停止编辑静默一段时间后自动写入数据库
   */
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await persistTemplate();
        setAutoSaveStatus(
          t("autoSaved", {
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          })
        );
      } catch (err) {
        setAutoSaveStatus(
          t("autoSaveFailed", {
            msg: err instanceof Error ? err.message : t("unknownError"),
          })
        );
      }
    }, 1200);
  }, [t, persistTemplate]);

  /** 「更新及检查」:先保存最新内容,再校验内容完整性并展示结果 */
  const handleUpdateAndCheck = async () => {
    if (!templateRef.current) {
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);
    setAutoSaveStatus(null);
    setCheckResult(null);
    // 先尝试保存最新内容(更新)
    try {
      await persistTemplate();
      setSaveMessage(tc("updateComplete"));
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t("saveFailedRetry"));
    }
    // 再执行完整性检查:即使后端校验拒绝保存,遗漏清单也能照常展示,便于用户排查
    const issues = validateTemplate(templateRef.current, t);
    setCheckResult(issues);
    setSaving(false);
    // 更新及检查完成后:记录"刷新后进入逻辑界面"的意图并自动刷新定位,
    // 效果相当于手动刷新网页后再点击仪表盘「逻辑界面」
    window.sessionStorage.setItem("dolphin_active_tab", "logic");
    window.setTimeout(() => window.location.reload(), 1200);
  };

  /** 效果预览:滚动到合并页面顶部的交互界面区块(与点击仪表盘「交互界面」菜单一致),查看手机效果 */
  const handleEffectPreview = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        {tc("loading")}
      </div>
    );
  }

  if (error) {
    return <div className="py-16 text-center text-destructive">{error}</div>;
  }

  if (!template || !template.nodes) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        {tc("noTemplates")}
      </div>
    );
  }

  const previewNode = template.nodes.find((n) => n.id === previewNodeId);
  // 当前选中的节点(与交互界面联动,供「节点内容编辑表格」即时展示;未选中时可空)
  const selectedNode = selectedNodeId
    ? (template.nodes.find((n) => n.id === selectedNodeId) ?? null)
    : null;
  // guard 后 template.nodes 非空,提取供 JSX 内多次取用,避免重复判空
  const nodes = template.nodes;

  return (
    <div className="space-y-6">
      {/* 逻辑界面(节点图,排列在上) */}
      <div>
        <h4 className="mt-3 text-sm font-medium text-foreground">
          {t("selectNodeByGraph")}
        </h4>
        <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-blue-600" />{" "}
            {t("legendP1")}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-orange-600" />{" "}
            {t("legendP2")}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-green-600" />{" "}
            {t("legendP3")}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-purple-600" />{" "}
            {t("legendP4")}
          </span>
        </div>
        <div ref={chartRef} className="h-[560px] w-full rounded-2xl border border-border" />
      </div>

      {/* 节点内容编辑表格(节点图下方,即时展示所选节点,避免往下翻) */}
      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-semibold text-foreground">{t("nodeEditTable")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("nodeEditTableHint")}
          </p>
        </div>

        {selectedNode ? (
          <div className="px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  selectedNode.level === "P4"
                    ? "bg-purple-500/10 text-purple-600"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {selectedNode.level}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {selectedNode.id.slice(-10)}
              </span>
            </div>
            {/* P4 结果节点:内容由父级选项派生,只读展示,禁止编辑;其余层级可编辑问题文本 */}
            {selectedNode.level === "P4" ? (
              <div className="mt-2 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground">
                {getParentOptionText(nodes, selectedNode)}
              </div>
            ) : (
              <input
                value={selectedNode.question}
                onChange={(e) =>
                  updateNodeQuestion(selectedNode.id, e.target.value)
                }
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                placeholder={t("questionPlaceholder")}
              />
            )}
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {selectedNode.options.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {option.optionLabel}
                  </span>
                  <input
                    value={option.optionText}
                    onChange={(e) =>
                      updateOptionText(selectedNode.id, option.id, e.target.value)
                    }
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary"
                    placeholder={t("optionPlaceholder")}
                  />
                </div>
              ))}
              {selectedNode.options.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("resultNodeNoOptions")}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            {t("selectNodePrompt")}
          </div>
        )}

        <div className="flex items-center gap-4 border-t border-border px-5 py-4">
          <Button onClick={handleUpdateAndCheck} disabled={saving}>
            {saving ? tc("updating") : t("updateAndCheck")}
          </Button>
          <Button variant="outline" onClick={handleEffectPreview}>
            {t("effectPreview")}
          </Button>
          {saveMessage && (
            <span className="text-sm text-green-600">{saveMessage}</span>
          )}
          {saveError && (
            <span className="text-sm text-destructive">{saveError}</span>
          )}
          {autoSaveStatus && (
            <span className="text-xs text-muted-foreground">
              {autoSaveStatus}
            </span>
          )}
        </div>

        {/* 检查结果展示 */}
        {checkResult && (
          <div className="border-t border-border px-5 py-3">
            {checkResult.length === 0 ? (
              <p className="text-sm font-medium text-green-600">
                {t("checkPassed")}
              </p>
            ) : (
              <div className="text-sm text-destructive">
                <p className="font-medium">
                  {t("foundIssues", { count: checkResult.length })}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {checkResult.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 输入表格(排列在下,与逻辑界面共用右侧) */}
      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-semibold text-foreground">
            {t("fullEditTable")}
          </h3>
        </div>

        <div className="divide-y divide-border">
          {template.nodes.map((node) => (
            <div
              key={node.id}
              id={`node-editor-${node.id}`}
              className={cn(
                "px-5 py-4 transition-colors",
                selectedNodeId === node.id && "bg-primary/5"
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    node.level === "P4"
                      ? "bg-purple-500/10 text-purple-600"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {node.level}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {node.id.slice(-10)}
                </span>
              </div>

              {/* P4 结果节点:只读展示父级选项派生的内容;其余层级可编辑问题文本 */}
              {node.level === "P4" ? (
                <div className="mt-2 w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground">
                  {getParentOptionText(nodes, node)}
                </div>
              ) : (
                <input
                  value={node.question}
                  onChange={(e) => updateNodeQuestion(node.id, e.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  placeholder={t("questionPlaceholder")}
                />
              )}

              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {node.options.map((option) => (
                  <div key={option.id} className="flex items-center gap-2">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {option.optionLabel}
                    </span>
                    <input
                      value={option.optionText}
                      onChange={(e) =>
                        updateOptionText(node.id, option.id, e.target.value)
                      }
                      className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary"
                      placeholder={t("optionPlaceholder")}
                    />
                  </div>
                ))}
                {node.options.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t("resultNodeNoOptions")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 border-t border-border px-5 py-4">
          <Button onClick={handleUpdateAndCheck} disabled={saving}>
            {saving ? tc("updating") : t("updateAndCheck")}
          </Button>
          <Button variant="outline" onClick={handleEffectPreview}>
            {t("effectPreview")}
          </Button>
          {saveMessage && (
            <span className="text-sm text-green-600">{saveMessage}</span>
          )}
          {saveError && (
            <span className="text-sm text-destructive">{saveError}</span>
          )}
          {autoSaveStatus && (
            <span className="text-xs text-muted-foreground">
              {autoSaveStatus}
            </span>
          )}
        </div>

        {/* 检查结果展示 */}
        {checkResult && (
          <div className="border-t border-border px-5 py-3">
            {checkResult.length === 0 ? (
              <p className="text-sm font-medium text-green-600">
                {t("checkPassed")}
              </p>
            ) : (
              <div className="text-sm text-destructive">
                <p className="font-medium">
                  {t("foundIssues", { count: checkResult.length })}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {checkResult.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* P3 问卷效果预览(输入表格下方,与交互界面关联) */}
      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-foreground">
            {t("previewTitle")}
          </label>
          <select
            value={previewNodeId}
            onChange={(e) => setPreviewNodeId(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">{t("selectNodePlaceholder")}</option>
            {template.nodes
              .filter((n) => n.level !== "P4")
              .map((n) => (
                <option key={n.id} value={n.id}>
                  {n.level}-{n.id.slice(-8)}
                </option>
              ))}
          </select>
        </div>

        {previewNode && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <p className="mb-3 font-medium text-foreground">
              {previewNode.question}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {previewNode.options.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground"
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {o.optionLabel}
                  </span>
                  <span className="flex-1">{o.optionText}</span>
                  {o.resultTheme && (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                      {o.resultTheme}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {t("previewHint")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
