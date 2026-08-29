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
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type {
  DashboardProject,
  InquiryLimitStatus,
} from "@/features/dashboard/types";

// 状态显示映射(中文键为 projectStatus 数据库存储值,属数据契约禁止改动;
// labelKey 指向 dashboard.views.common 的 status.* 翻译键,渲染时解析)
const STATUS_LABELS: Record<string, { labelKey: string; className: string }> = {
  跟进: { labelKey: "followUp", className: "bg-blue-500/10 text-blue-600" },
  获单: { labelKey: "won", className: "bg-green-500/10 text-green-600" },
  失单: { labelKey: "lost", className: "bg-red-500/10 text-red-600" },
};

// 状态流转选项:当前状态 -> 可流转目标(值为数据库存储状态,数据契约)
const STATUS_ACTIONS: Record<string, string[]> = {
  跟进: ["获单", "失单"],
  失单: ["跟进"],
};

type TemplateData = {
  projects: DashboardProject[];
  limitStatus: InquiryLimitStatus;
  /** 项目查看授权:projectId -> 已授权销售经理 ID 列表 */
  projectPermissions: Record<string, string[]>;
  /** 当前用户是否为团队管理员(可授权销售经理查看项目) */
  canGrantAccess: boolean;
};

/** 团队成员信息(用于销售经理选择,与 /api/dashboard/team/members 响应一致) */
type TeamMember = {
  id: string;
  name: string;
  email: string;
  teamRole: string;
  isTeamAdmin: boolean;
  userRole: string;
};

export function InteractionView() {
  const t = useTranslations("dashboard.views.kanban");
  const tc = useTranslations("dashboard.views.common");
  const [data, setData] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [grantProjectId, setGrantProjectId] = useState<string | null>(null);
  const [salesManagers, setSalesManagers] = useState<TeamMember[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/template");
      if (!res.ok) {
        throw new Error(tc("loadFailed"));
      }
      const json = (await res.json()) as TemplateData;
      setData(json);
      setError(null);
    } catch {
      setError(t("loadProjectsFailed"));
    } finally {
      setLoading(false);
    }
  }, [t, tc]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 管理员视角:加载本团队销售经理列表(用于授权面板选择)
  useEffect(() => {
    if (!data?.canGrantAccess) {
      return;
    }
    fetch("/api/dashboard/team/members")
      .then((res) => res.json())
      .then((json: { members?: TeamMember[] }) => {
        setSalesManagers(
          (json.members ?? []).filter((m) => m.userRole === "sales_manager")
        );
      })
      .catch(() => {
        setSalesManagers([]);
      });
  }, [data?.canGrantAccess]);

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
        alert(json?.error ?? t("statusUpdateFailed"));
        return;
      }
      await fetchData();
    } catch {
      alert(tc("networkError"));
    } finally {
      setUpdatingId(null);
    }
  };

  /** 管理员授权/撤销销售经理查看指定项目 */
  const handleToggleAccess = async (
    projectId: string,
    managerId: string,
    isGranted: boolean
  ) => {
    try {
      const res = await fetch("/api/dashboard/project-permissions", {
        method: isGranted ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, managerId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        alert(json?.error ?? t("operationFailed"));
        return;
      }
      await fetchData();
    } catch {
      alert(tc("networkError"));
    }
  };

  if (loading && !data) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        {tc("loading")}
      </div>
    );
  }

  if (error) {
    return <div className="py-16 text-center text-destructive">{error}</div>;
  }

  const projects = data?.projects ?? [];
  const limitStatus = data?.limitStatus;
  const projectPermissions = data?.projectPermissions ?? {};
  const canGrantAccess = data?.canGrantAccess ?? false;

  return (
    <div className="space-y-6">
      {/* 升级提示横幅(AC-06) */}
      {limitStatus && (limitStatus.isLimited || limitStatus.isNearLimit) && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-700">
          <p className="font-medium">
            {limitStatus.isLimited
              ? t("limitReachedBanner")
              : t("nearLimitBanner", { count: limitStatus.count })}
          </p>
          <p className="mt-1 text-amber-600">
            {t("upgradeHint")}
            <Link
              href="/pricing"
              className="ml-2 underline underline-offset-2"
            >
              {t("viewPricing")}
            </Link>
          </p>
        </div>
      )}

      {/* 今日询盘统计(仅套餐有每日询盘上限时展示,Pro/Max 无限制不显示) */}
      {limitStatus && limitStatus.limit !== null && (
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-muted px-3 py-1 text-muted-foreground">
            {t("todayInquiries", {
              count: limitStatus.count,
              limit: limitStatus.limit,
            })}
          </span>
        </div>
      )}

      {/* 项目列表 */}
      {projects.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          {t("noProjects")}
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
                    {t("customer", { name: project.customerName })}
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
                  {STATUS_LABELS[project.projectStatus]
                    ? tc(
                        `status.${STATUS_LABELS[project.projectStatus].labelKey}`
                      )
                    : project.projectStatus}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p>
                  {t("inquiryTime")}
                  {project.inquiryDatetime
                    ? new Date(project.inquiryDatetime).toLocaleString()
                    : "-"}
                </p>
                {project.durationHours !== null && (
                  <p>
                    {t("duration", {
                      hours: Number(project.durationHours).toFixed(2),
                    })}
                  </p>
                )}
                {project.over3Days && (
                  <p className="text-amber-600">{t("overThreeDays")}</p>
                )}
                {project.replyDatetime && (
                  <p>
                    {t("replyTime")}
                    {new Date(project.replyDatetime).toLocaleString()}
                  </p>
                )}
                {project.notificationTime && (
                  <p>
                    {t("notificationTime")}
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
                      {updatingId === project.id
                        ? tc("updating")
                        : tc("setTo", {
                            action: tc(
                              `status.${STATUS_LABELS[action]?.labelKey}`
                            ),
                          })}
                    </button>
                  ))}
                </div>
              )}

              {/* 项目查看授权(仅团队管理员可授权销售经理查看非自己跟踪的项目) */}
              {canGrantAccess && (
                <div className="mt-4 border-t border-border pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {t("grantedManagers")}
                      {(() => {
                        const grantedIds = projectPermissions[project.id] ?? [];
                        if (grantedIds.length === 0) {
                          return ` ${tc("none")}`;
                        }
                        const names = grantedIds
                          .map((id) => salesManagers.find((m) => m.id === id)?.name)
                          .filter((n): n is string => Boolean(n));
                        return names.length > 0
                          ? ` ${names.join(t("nameSeparator"))}`
                          : ` ${tc("none")}`;
                      })()}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setGrantProjectId(
                          grantProjectId === project.id ? null : project.id
                        )
                      }
                      className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground hover:bg-hover"
                    >
                      {grantProjectId === project.id
                        ? tc("close")
                        : t("grantToManagers")}
                    </button>
                  </div>

                  {grantProjectId === project.id && (
                    <div className="mt-2 space-y-1">
                      {salesManagers.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          {t("noSalesManagers")}
                        </p>
                      ) : (
                        salesManagers.map((manager) => {
                          const isGranted = (
                            projectPermissions[project.id] ?? []
                          ).includes(manager.id);
                          return (
                            <button
                              key={manager.id}
                              type="button"
                              onClick={() =>
                                handleToggleAccess(
                                  project.id,
                                  manager.id,
                                  isGranted
                                )
                              }
                              className={cn(
                                "flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs transition hover:bg-hover",
                                isGranted
                                  ? "bg-primary/10 text-primary"
                                  : "text-muted-foreground"
                              )}
                            >
                              <span>{manager.name}</span>
                              <span>
                                {isGranted
                                  ? t("grantedHint")
                                  : t("notGrantedHint")}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
