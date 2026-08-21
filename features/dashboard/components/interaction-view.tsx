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

// Dashboard 交互界面(Phase 3 Task 3.1/3.8)
//
// 手机优先:展示项目列表与状态流转
// - 升级提示横幅(询盘接近/达到上限时)
// - 项目卡片:编号/客户/主题/询盘时间/状态
// - 状态流转:跟进 → 获单/失单,失单可回跟进

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type {
  DashboardProject,
  InquiryLimitStatus,
} from "@/features/dashboard/types";

// 状态显示映射
const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  跟进: { label: "跟进", className: "bg-blue-500/10 text-blue-600" },
  获单: { label: "获单", className: "bg-green-500/10 text-green-600" },
  失单: { label: "失单", className: "bg-red-500/10 text-red-600" },
};

// 状态流转选项:当前状态 -> 可流转目标
const STATUS_ACTIONS: Record<string, string[]> = {
  跟进: ["获单", "失单"],
  失单: ["跟进"],
};

type TemplateData = {
  projects: DashboardProject[];
  limitStatus: InquiryLimitStatus;
};

export function InteractionView() {
  const [data, setData] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/template");
      if (!res.ok) {
        throw new Error("加载失败");
      }
      const json = (await res.json()) as TemplateData;
      setData(json);
      setError(null);
    } catch {
      setError("加载项目数据失败,请刷新重试");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** 更新项目状态 */
  const handleStatusChange = async (projectId: string, status: string) => {
    setUpdatingId(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        alert(json?.error ?? "状态更新失败");
        return;
      }
      await fetchData();
    } catch {
      alert("网络异常,请重试");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading && !data) {
    return <div className="py-16 text-center text-muted-foreground">加载中...</div>;
  }

  if (error) {
    return <div className="py-16 text-center text-destructive">{error}</div>;
  }

  const projects = data?.projects ?? [];
  const limitStatus = data?.limitStatus;

  return (
    <div className="space-y-6">
      {/* 升级提示横幅(AC-06) */}
      {limitStatus && (limitStatus.isLimited || limitStatus.isNearLimit) && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-700">
          <p className="font-medium">
            {limitStatus.isLimited
              ? "今日询盘次数已达上限(5次/天),客户将无法继续提交询盘。"
              : `今日询盘已达 ${limitStatus.count} 次,接近免费套餐上限(5次/天)。`}
          </p>
          <p className="mt-1 text-amber-600">
            为不影响团队顺利承接业务,建议考虑升级套餐。
            <Link
              href="/pricing"
              className="ml-2 underline underline-offset-2"
            >
              查看定价
            </Link>
          </p>
        </div>
      )}

      {/* 今日询盘统计 */}
      {limitStatus && (
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
            今日询盘:{limitStatus.count}/{limitStatus.limit} 次
          </span>
        </div>
      )}

      {/* 项目列表 */}
      {projects.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          暂无项目,客户完成 Quiz 后项目将显示在这里。
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-2xl border border-border bg-background p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-all font-mono text-sm font-medium text-foreground">
                    {project.projectNumber}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    客户:{project.customerName}
                    {project.theme ? ` · ${project.theme}` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                    STATUS_LABELS[project.projectStatus]?.className ??
                      "bg-muted text-muted-foreground"
                  )}
                >
                  {STATUS_LABELS[project.projectStatus]?.label ??
                    project.projectStatus}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p>
                  询盘时间:
                  {project.inquiryDatetime
                    ? new Date(project.inquiryDatetime).toLocaleString()
                    : "-"}
                </p>
                {project.durationHours !== null && (
                  <p>持续:{Number(project.durationHours).toFixed(2)} 小时</p>
                )}
                {project.over3Days && (
                  <p className="text-amber-600">已超过 3 天</p>
                )}
                {project.replyDatetime && (
                  <p>
                    回复时间:
                    {new Date(project.replyDatetime).toLocaleString()}
                  </p>
                )}
                {project.notificationTime && (
                  <p>
                    系统通知时间:
                    {new Date(project.notificationTime).toLocaleString()}
                  </p>
                )}
              </div>

              {/* 状态流转按钮(销售总监可修改) */}
              {(STATUS_ACTIONS[project.projectStatus] ?? []).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {STATUS_ACTIONS[project.projectStatus].map((action) => (
                    <button
                      key={action}
                      type="button"
                      disabled={updatingId === project.id}
                      onClick={() => handleStatusChange(project.id, action)}
                      className={cn(
                        "rounded-full px-4 py-1.5 text-xs font-medium transition",
                        action === "获单"
                          ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                          : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                      )}
                    >
                      {updatingId === project.id ? "更新中..." : `设为${action}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
