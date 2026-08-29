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

// Dashboard 数据分析模块(Phase 5,AC-15)
//
// 功能:展示10个ECharts分析图表
// 套餐分级:图表1免费可见,图表2-10仅Pro/Max套餐可见(MVP阶段锁定)
// 图表使用ECharts柱状图,每个图表一个卡片,带标题和说明
//
// 参考逻辑界面(logic-view.tsx)的ECharts使用模式:
// - useRef + useEffect 创建 ECharts 实例
// - 窗口 resize 时自动调整

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";

// ==================== 类型定义 ====================

// 图表配置(title/description 走 dashboard.views.analysis.charts.{key} 翻译键)
const CHARTS = [
  { id: 1, key: "weekly", proOnly: false },
  { id: 2, key: "hourly", proOnly: true },
  { id: 3, key: "monthly", proOnly: true },
  { id: 4, key: "quarterly", proOnly: true },
  { id: 5, key: "yearly", proOnly: true },
  { id: 6, key: "themeVisits", proOnly: true },
  { id: 7, key: "themeTimezone", proOnly: true },
  { id: 8, key: "managerProjects", proOnly: true },
  { id: 9, key: "managerThemes", proOnly: true },
  { id: 10, key: "managerReplyTime", proOnly: true },
] as const;

type ChartConfig = (typeof CHARTS)[number];

// 主题颜色调色板
const COLOR_PALETTE = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b"];

// 星期显示键:API 返回的 dayOfWeek 为中文匹配键,展示时映射到 dashboard.views.common.day.{key}
const DAY_KEY_MAP: Record<
  string,
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"
> = {
  "周一": "monday",
  "周二": "tuesday",
  "周三": "wednesday",
  "周四": "thursday",
  "周五": "friday",
  "周六": "saturday",
  "周日": "sunday",
};

// 订单状态显示键:status 为中文匹配键,展示时映射到 dashboard.views.common.status.{key}
const STATUS_KEY_MAP: Record<string, "won" | "lost" | "followUp"> = {
  "获单": "won",
  "失单": "lost",
  "跟进": "followUp",
};

// ==================== 图表配置构建函数 ====================

/** 根据图表编号和数据构建 ECharts option;t 为分析视图翻译函数,tc 为公共翻译函数 */
function buildChartOption(
  chartId: number,
  data: unknown,
  t: ReturnType<typeof useTranslations>,
  tc: ReturnType<typeof useTranslations>
): EChartsOption {
  if (chartId === 1) {
    const items = data as { dayOfWeek: string; count: number }[];
    // dayOrder 为 API 数据匹配键,保留中文;展示名经 DAY_KEY_MAP 走翻译
    const dayOrder = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    // 按 dayOrder 顺序排列数据
    const valueMap = new Map(items.map((i) => [i.dayOfWeek, i.count]));
    const values = dayOrder.map((d) => valueMap.get(d) ?? 0);
    const dayLabels = dayOrder.map((d) => tc(`day.${DAY_KEY_MAP[d]}`));
    return {
      title: { text: t("charts.weekly.title"), left: "center", textStyle: { fontSize: 14 } },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: dayLabels },
      yAxis: { type: "value", minInterval: 1 },
      series: [{ type: "bar", data: values, itemStyle: { color: "#3b82f6" } }],
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    };
  }

  if (chartId === 2) {
    const items = data as { hourRange: string; count: number }[];
    return {
      title: { text: t("charts.hourly.title"), left: "center", textStyle: { fontSize: 14 } },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: items.map((i) => i.hourRange) },
      yAxis: { type: "value", minInterval: 1 },
      series: [{ type: "bar", data: items.map((i) => i.count), itemStyle: { color: "#8b5cf6" } }],
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    };
  }

  if (chartId === 3) {
    const items = data as { month: string; count: number }[];
    return {
      title: { text: t("charts.monthly.title"), left: "center", textStyle: { fontSize: 14 } },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: items.map((i) => i.month) },
      yAxis: { type: "value", minInterval: 1 },
      series: [{ type: "bar", data: items.map((i) => i.count), itemStyle: { color: "#06b6d4" } }],
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    };
  }

  if (chartId === 4) {
    const items = data as { quarter: string; count: number }[];
    return {
      title: { text: t("charts.quarterly.title"), left: "center", textStyle: { fontSize: 14 } },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: items.map((i) => i.quarter) },
      yAxis: { type: "value", minInterval: 1 },
      series: [{ type: "bar", data: items.map((i) => i.count), itemStyle: { color: "#f97316" } }],
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    };
  }

  if (chartId === 5) {
    const items = data as { year: string; count: number }[];
    return {
      title: { text: t("charts.yearly.title"), left: "center", textStyle: { fontSize: 14 } },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: items.map((i) => i.year) },
      yAxis: { type: "value", minInterval: 1 },
      series: [{ type: "bar", data: items.map((i) => i.count), itemStyle: { color: "#14b8a6" } }],
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    };
  }

  if (chartId === 6) {
    const items = data as { theme: string; count: number }[];
    return {
      title: { text: t("charts.themeVisits.title"), left: "center", textStyle: { fontSize: 14 } },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: items.map((i) => i.theme) },
      yAxis: { type: "value", minInterval: 1 },
      series: [{ type: "bar", data: items.map((i) => i.count), itemStyle: { color: "#ec4899" } }],
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    };
  }

  if (chartId === 7) {
    const items = data as { hourRange: string; series: { theme: string; count: number }[] }[];
    const themes = items.length > 0 ? items[0].series.map((s) => s.theme) : [];
    return {
      title: { text: t("charts.themeTimezone.title"), left: "center", textStyle: { fontSize: 14 } },
      tooltip: { trigger: "axis" },
      legend: { data: themes, top: 30 },
      xAxis: { type: "category", data: items.map((i) => i.hourRange) },
      yAxis: { type: "value", minInterval: 1 },
      series: themes.map((theme, idx) => ({
        name: theme,
        type: "bar" as const,
        stack: "total",
        data: items.map((i) => i.series.find((s) => s.theme === theme)?.count ?? 0),
        itemStyle: { color: COLOR_PALETTE[idx % COLOR_PALETTE.length] },
        emphasis: { focus: "series" },
      })),
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    };
  }

  if (chartId === 8) {
    const items = data as { managerName: string; series: { status: string; count: number }[] }[];
    // statuses 为 API 数据匹配键,保留中文;展示名经 STATUS_KEY_MAP 走翻译
    const statuses = ["获单", "失单", "跟进"];
    const statusColors: Record<string, string> = {
      "获单": "#22c55e",
      "失单": "#ef4444",
      "跟进": "#3b82f6",
    };
    const statusLabels = statuses.map((s) => tc(`status.${STATUS_KEY_MAP[s]}`));
    return {
      title: { text: t("charts.managerProjects.title"), left: "center", textStyle: { fontSize: 14 } },
      tooltip: { trigger: "axis" },
      legend: { data: statusLabels, top: 30 },
      xAxis: { type: "category", data: items.map((i) => i.managerName) },
      yAxis: { type: "value", minInterval: 1 },
      series: statuses.map((status, idx) => ({
        name: statusLabels[idx],
        type: "bar" as const,
        stack: "total",
        data: items.map((i) => i.series.find((s) => s.status === status)?.count ?? 0),
        itemStyle: { color: statusColors[status] },
        emphasis: { focus: "series" },
      })),
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    };
  }

  if (chartId === 9) {
    const items = data as { managerName: string; series: { theme: string; count: number }[] }[];
    const themes = items.length > 0 ? items[0].series.map((s) => s.theme) : [];
    return {
      title: { text: t("charts.managerThemes.title"), left: "center", textStyle: { fontSize: 14 } },
      tooltip: { trigger: "axis" },
      legend: { data: themes, top: 30 },
      xAxis: { type: "category", data: items.map((i) => i.managerName) },
      yAxis: { type: "value", minInterval: 1 },
      series: themes.map((theme, idx) => ({
        name: theme,
        type: "bar" as const,
        stack: "total",
        data: items.map((i) => i.series.find((s) => s.theme === theme)?.count ?? 0),
        itemStyle: { color: COLOR_PALETTE[idx % COLOR_PALETTE.length] },
        emphasis: { focus: "series" },
      })),
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    };
  }

  if (chartId === 10) {
    const items = data as { managerName: string; avgHours: number }[];
    return {
      title: { text: t("charts.managerReplyTime.title"), left: "center", textStyle: { fontSize: 14 } },
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) =>
          t("avgReplyTimeTooltip", { value: (params as { value: number }[])[0]?.value ?? 0 }),
      },
      xAxis: { type: "category", data: items.map((i) => i.managerName) },
      yAxis: { type: "value", name: t("unitHours") },
      series: [{ type: "bar", data: items.map((i) => i.avgHours), itemStyle: { color: "#a855f7" } }],
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    };
  }

  return {};
}

// ==================== 单个图表卡片组件 ====================

function ChartCard({ config }: { config: ChartConfig }) {
  const t = useTranslations("dashboard.views.analysis");
  const tc = useTranslations("dashboard.views.common");
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<unknown>(null);

  // 获取数据。
  // 父组件以 key={config.id} 保证图表切换时重建本组件,state 已随挂载重置,
  // 此处无需再手动 setState 清空,避免在 effect 中同步触发重渲染。
  useEffect(() => {
    let cancelled = false;

    fetch(`/api/dashboard/analysis?chart=${config.id}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? tc("loadFailed"));
        }
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json.data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("loadDataFailed"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [config.id, t, tc]);

  // 渲染 ECharts
  useEffect(() => {
    if (loading || error || !data || !chartRef.current) return;

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
    }

    const option = buildChartOption(config.id, data, t, tc);
    chartInstanceRef.current.setOption(option, true);

    // 窗口 resize 自适应
    const handleResize = () => chartInstanceRef.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [loading, error, data, config.id, t, tc]);

  // 组件卸载时销毁 ECharts 实例
  useEffect(() => {
    return () => {
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <h3 className="font-semibold text-foreground">{t(`charts.${config.key}.title`)}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{t(`charts.${config.key}.description`)}</p>
      <div className="mt-4">
        {loading && (
          <div className="h-[300px] animate-pulse rounded-xl bg-muted" />
        )}
        {error && (
          <div className="flex h-[300px] items-center justify-center rounded-xl bg-muted/30">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        {!loading && !error && (
          <div ref={chartRef} className="h-[300px] w-full" />
        )}
      </div>
    </div>
  );
}

// ==================== 锁定状态卡片 ====================

function LockedChartCard({ config }: { config: ChartConfig }) {
  const t = useTranslations("dashboard.views.analysis");

  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <h3 className="font-semibold text-foreground">{t(`charts.${config.key}.title`)}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{t(`charts.${config.key}.description`)}</p>
      <div className="mt-4 flex h-[300px] items-center justify-center rounded-xl bg-muted/30">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl">
            🔒
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {t("locked.planRequired")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            {t("locked.unlockHint")}
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-block rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            {t("locked.upgrade")}
          </Link>
        </div>
      </div>
    </div>
  );
}

// ==================== 主组件 ====================

export function AnalysisView() {
  const t = useTranslations("dashboard.views.analysis");

  // 套餐状态: null=加载中, false=免费, true=Pro/Max
  const [isPro, setIsPro] = useState<boolean | null>(null);

  // 挂载时检查用户套餐权限
  useEffect(() => {
    fetch("/api/dashboard/analysis?chart=2")
      .then((res) => {
        setIsPro(res.ok);
      })
      .catch(() => {
        setIsPro(false);
      });
  }, []);

  // 加载中
  if (isPro === null) {
    return (
      <div className="space-y-6">
        {CHARTS.map((config) => (
          <div key={config.id} className="rounded-2xl border border-border bg-background p-5">
            <h3 className="font-semibold text-foreground">{t(`charts.${config.key}.title`)}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t(`charts.${config.key}.description`)}</p>
            <div className="mt-4 h-[300px] animate-pulse rounded-xl bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 套餐升级提示横幅(仅免费用户可见) */}
      {!isPro && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {t("banner.freePlanTitle")}
              </p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                {t("banner.freePlanDescription")}
              </p>
            </div>
            <Link
              href="/pricing"
              className="flex-shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
            >
              {t("banner.viewPlans")}
            </Link>
          </div>
        </div>
      )}

      {/* 图表1:免费可见 */}
      <ChartCard config={CHARTS[0]} />

      {/* 图表2-10:根据套餐状态显示 */}
      <div className="space-y-6">
        {CHARTS.slice(1).map((config) =>
          isPro ? (
            <ChartCard key={config.id} config={config} />
          ) : (
            <LockedChartCard key={config.id} config={config} />
          )
        )}
      </div>
    </div>
  );
}