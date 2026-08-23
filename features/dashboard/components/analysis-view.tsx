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
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";

// ==================== 类型定义 ====================

type ChartConfig = {
  id: number;
  title: string;
  description: string;
  proOnly: boolean;
};

// 10 个图表的配置
const CHARTS: ChartConfig[] = [
  { id: 1, title: "每周访问量分布", description: "过去一周,按星期统计访问量", proOnly: false },
  { id: 2, title: "访问时区分布", description: "过去一周,每2小时一段统计访问量", proOnly: true },
  { id: 3, title: "每月访问量分布", description: "过去13个月,按月统计访问量", proOnly: true },
  { id: 4, title: "每季访问量分布", description: "Q1-Q4季度访问量统计", proOnly: true },
  { id: 5, title: "每年访问量分布", description: "按年统计访问量", proOnly: true },
  { id: 6, title: "主题访问量分布", description: "过去一个月,按主题统计访问量", proOnly: true },
  { id: 7, title: "主题访问时区分布", description: "过去一个月,12时段×4主题交叉统计", proOnly: true },
  { id: 8, title: "销售经理处理项目数量统计", description: "过去一个月,经理×状态(获单/失单/跟进)", proOnly: true },
  { id: 9, title: "销售经理处理主题数量统计", description: "过去一个月,经理×主题", proOnly: true },
  { id: 10, title: "销售经理平均回复时间分布", description: "过去一个月,经理平均回复时间(小时)", proOnly: true },
];

// 主题颜色调色板
const COLOR_PALETTE = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b"];

// ==================== 图表配置构建函数 ====================

/** 根据图表编号和数据构建 ECharts option */
function buildChartOption(chartId: number, data: unknown): EChartsOption {
  if (chartId === 1) {
    const items = data as { dayOfWeek: string; count: number }[];
    const dayOrder = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    // 按 dayOrder 顺序排列数据
    const valueMap = new Map(items.map((i) => [i.dayOfWeek, i.count]));
    const values = dayOrder.map((d) => valueMap.get(d) ?? 0);
    return {
      title: { text: "每周访问量分布", left: "center", textStyle: { fontSize: 14 } },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: dayOrder },
      yAxis: { type: "value", minInterval: 1 },
      series: [{ type: "bar", data: values, itemStyle: { color: "#3b82f6" } }],
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    };
  }

  if (chartId === 2) {
    const items = data as { hourRange: string; count: number }[];
    return {
      title: { text: "访问时区分布", left: "center", textStyle: { fontSize: 14 } },
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
      title: { text: "每月访问量分布", left: "center", textStyle: { fontSize: 14 } },
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
      title: { text: "每季访问量分布", left: "center", textStyle: { fontSize: 14 } },
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
      title: { text: "每年访问量分布", left: "center", textStyle: { fontSize: 14 } },
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
      title: { text: "主题访问量分布", left: "center", textStyle: { fontSize: 14 } },
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
      title: { text: "主题访问时区分布", left: "center", textStyle: { fontSize: 14 } },
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
    const statuses = ["获单", "失单", "跟进"];
    const statusColors: Record<string, string> = {
      "获单": "#22c55e",
      "失单": "#ef4444",
      "跟进": "#3b82f6",
    };
    return {
      title: { text: "销售经理处理项目数量统计", left: "center", textStyle: { fontSize: 14 } },
      tooltip: { trigger: "axis" },
      legend: { data: statuses, top: 30 },
      xAxis: { type: "category", data: items.map((i) => i.managerName) },
      yAxis: { type: "value", minInterval: 1 },
      series: statuses.map((status) => ({
        name: status,
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
      title: { text: "销售经理处理主题数量统计", left: "center", textStyle: { fontSize: 14 } },
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
      title: { text: "销售经理平均回复时间分布", left: "center", textStyle: { fontSize: 14 } },
      tooltip: { trigger: "axis", formatter: (params: unknown) => `平均回复时间: ${(params as { value: number }[])[0]?.value ?? 0}小时` },
      xAxis: { type: "category", data: items.map((i) => i.managerName) },
      yAxis: { type: "value", name: "小时" },
      series: [{ type: "bar", data: items.map((i) => i.avgHours), itemStyle: { color: "#a855f7" } }],
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    };
  }

  return {};
}

// ==================== 单个图表卡片组件 ====================

function ChartCard({ config }: { config: ChartConfig }) {
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
          throw new Error(body?.error ?? "加载失败");
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
          setError(err instanceof Error ? err.message : "数据加载失败");
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
  }, [config.id]);

  // 渲染 ECharts
  useEffect(() => {
    if (loading || error || !data || !chartRef.current) return;

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
    }

    const option = buildChartOption(config.id, data);
    chartInstanceRef.current.setOption(option, true);

    // 窗口 resize 自适应
    const handleResize = () => chartInstanceRef.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [loading, error, data, config.id]);

  // 组件卸载时销毁 ECharts 实例
  useEffect(() => {
    return () => {
      chartInstanceRef.current?.dispose();
      chartInstanceRef.current = null;
    };
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <h3 className="font-semibold text-foreground">{config.title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{config.description}</p>
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
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <h3 className="font-semibold text-foreground">{config.title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{config.description}</p>
      <div className="mt-4 flex h-[300px] items-center justify-center rounded-xl bg-muted/30">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-xl">
            🔒
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Pro/Max 套餐可用
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            升级套餐解锁全部分析图表
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-block rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            升级套餐
          </Link>
        </div>
      </div>
    </div>
  );
}

// ==================== 主组件 ====================

export function AnalysisView() {
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
            <h3 className="font-semibold text-foreground">{config.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{config.description}</p>
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
                💡 当前为免费套餐
              </p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                基础图表(每周访问量分布)可免费查看。升级 Pro/Max 套餐可解锁全部 10 个分析图表,
                获取更全面的销售数据分析。
              </p>
            </div>
            <Link
              href="/pricing"
              className="flex-shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
            >
              查看套餐
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