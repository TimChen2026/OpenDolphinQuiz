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

// Dashboard 数据库模块组件(Phase 4,AC-11/AC-12/AC-13)
// 三 Tab 界面：项目数据表格(搜索/筛选/导出/行内编辑/刷新持续时间)、审计日志、备份管理
"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { DashboardProject } from "@/features/dashboard/types";

// 审计日志条目类型
type AuditLogEntry = {
  id: string;
  actionType: string;
  description: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
};

// 导出状态
type ExportStatus = "idle" | "exporting" | "success" | "error";

// 备份状态
type BackupStatus = "idle" | "loading" | "success" | "error";

// 更新持续时间状态
type RefreshStatus = "idle" | "refreshing" | "success" | "error";

// Tab 定义(label 走 dashboard.views.database.tabs.{key} 翻译键)
const TABS = [
  { key: "data" },
  { key: "audit" },
  { key: "backup" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// 审计操作类型的翻译键白名单(白名单外的值在展示处原样显示 API 返回内容)
const ACTION_KEYS = ["login", "logout", "export", "delete", "update", "create"] as const;

type ActionType = (typeof ACTION_KEYS)[number];

function isActionType(value: string): value is ActionType {
  return (ACTION_KEYS as readonly string[]).includes(value);
}

export function DatabaseView() {
  const t = useTranslations("dashboard.views.database");
  const tc = useTranslations("dashboard.views.common");
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [themeManagers, setThemeManagers] = useState<Record<string, string>>({});
  const [auditLogsData, setAuditLogsData] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");
  const [backupStatus, setBackupStatus] = useState<BackupStatus>("idle");
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>("idle");
  const [activeTab, setActiveTab] = useState<TabKey>("data");
  const [loading, setLoading] = useState(true);

  // 行内编辑状态
  const [editingCell, setEditingCell] = useState<{
    projectId: string;
    field: "projectAmount" | "notes";
  } | null>(null);
  const [editingValue, setEditingValue] = useState("");

  // 加载项目数据
  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/template");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects ?? []);
        // 主题 → 跟踪项目经理映射(团队界面配置)
        setThemeManagers(data.themeManagers ?? {});
      }
    } catch (e) {
      console.error("加载项目数据失败", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载审计日志
  const loadAuditLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setAuditLogsData(data.logs ?? []);
      }
    } catch (e) {
      console.error("加载审计日志失败", e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 切换 Tab 时加载审计日志
  useEffect(() => {
    if (activeTab === "audit") {
      loadAuditLogs();
    }
  }, [activeTab, loadAuditLogs]);

  // Excel 导出
  const handleExport = async () => {
    setExportStatus("exporting");
    try {
      const res = await fetch("/api/dashboard/export");
      // 检查响应是否为 JSON 格式的错误响应
      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok) {
        if (contentType.includes("application/json")) {
          const err = await res.json();
          throw new Error(err.error ?? t("exportFailed"));
        }
        throw new Error(t("exportFailed"));
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `projects-${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus("success");
    } catch (e) {
      console.error("导出失败", e);
      setExportStatus("error");
    }
  };

  // 手动备份
  const handleBackup = async () => {
    setBackupStatus("loading");
    try {
      const res = await fetch("/api/dashboard/backup", { method: "POST" });
      if (!res.ok) throw new Error(t("backupFailed"));
      setBackupStatus("success");
    } catch (e) {
      console.error("备份失败", e);
      setBackupStatus("error");
    }
  };

  // 刷新持续时间
  const handleRefreshDuration = async () => {
    setRefreshStatus("refreshing");
    try {
      const res = await fetch("/api/dashboard/refresh-duration", { method: "POST" });
      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok) {
        if (contentType.includes("application/json")) {
          const err = await res.json();
          throw new Error(err.error ?? t("refreshFailed"));
        }
        throw new Error(t("refreshFailed"));
      }
      setRefreshStatus("success");
      // 刷新完成后重新加载数据
      await loadData();
      // 3 秒后自动清除状态
      setTimeout(() => setRefreshStatus("idle"), 3000);
    } catch (e) {
      console.error("刷新持续时间失败", e);
      setRefreshStatus("error");
    }
  };

  // 保存行内编辑的字段
  const handleCellSave = async (
    projectId: string,
    field: "projectAmount" | "notes"
  ) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: editingValue || null }),
      });
      if (!res.ok) throw new Error(tc("saveFailed"));
      // 更新本地数据
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, [field]: editingValue || null } : p
        )
      );
      setEditingCell(null);
      setEditingValue("");
    } catch (e) {
      console.error("保存失败", e);
    }
  };

  // 筛选项目
  const filteredProjects = projects.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.projectNumber.toLowerCase().includes(q) ||
      (p.customerName ?? "").toLowerCase().includes(q) ||
      (p.theme ?? "").toLowerCase().includes(q)
    );
  });

  // 渲染项目数据表格
  const renderDataTable = () => (
    <div className="space-y-4">
      {/* 搜索和导出操作栏 */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={handleExport}
          disabled={exportStatus === "exporting"}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {exportStatus === "exporting" ? tc("exporting") : t("exportExcel")}
        </button>
        {exportStatus === "success" && (
          <span className="text-xs text-green-600">{t("exportSuccess")}</span>
        )}
        {exportStatus === "error" && (
          <span className="text-xs text-red-600">{t("exportFailedRetry")}</span>
        )}
        <button
          type="button"
          onClick={handleRefreshDuration}
          disabled={refreshStatus === "refreshing"}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
        >
          {refreshStatus === "refreshing" ? tc("updating") : t("update")}
        </button>
        {refreshStatus === "success" && (
          <span className="text-xs text-green-600">{t("updateSuccess")}</span>
        )}
        {refreshStatus === "error" && (
          <span className="text-xs text-red-600">{t("updateFailedRetry")}</span>
        )}
      </div>

      {/* 数据表格 */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">{t("columns.projectNumber")}</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">{t("columns.customerName")}</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">{t("columns.theme")}</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">{t("columns.manager")}</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">{t("columns.status")}</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">{t("columns.amount")}</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">{t("columns.inquiryTime")}</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">{t("columns.duration")}</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">{t("columns.notifyTime")}</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">{t("columns.notes")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">
                  {loading ? tc("loading") : t("noProjects")}
                </td>
              </tr>
            ) : (
              filteredProjects.map((project) => (
                <tr key={project.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="max-w-[200px] truncate px-3 py-2 font-mono text-xs">
                    {project.projectNumber}
                  </td>
                  <td className="px-3 py-2">{project.customerName}</td>
                  <td className="px-3 py-2">{project.theme ?? "-"}</td>
                  <td className="px-3 py-2">
                    {/* 跟踪项目经理:按主题取团队界面配置的销售经理 */}
                    {themeManagers[project.theme ?? ""] ?? "-"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        "inline-block rounded-full px-2 py-0.5 text-xs font-medium " +
                        (project.projectStatus === "获单"
                          ? "bg-green-100 text-green-700"
                          : project.projectStatus === "失单"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700")
                      }
                    >
                      {project.projectStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {editingCell?.projectId === project.id &&
                    editingCell?.field === "projectAmount" ? (
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => handleCellSave(project.id, "projectAmount")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCellSave(project.id, "projectAmount");
                          if (e.key === "Escape") setEditingCell(null);
                        }}
                        className="w-20 rounded border border-input bg-background px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="cursor-pointer hover:text-primary"
                        onClick={() => {
                          setEditingCell({ projectId: project.id, field: "projectAmount" });
                          setEditingValue(project.projectAmount ?? "");
                        }}
                      >
                        {project.projectAmount ?? "-"}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs">
                    {project.inquiryDatetime
                      ? new Date(project.inquiryDatetime).toLocaleString("zh-CN")
                      : "-"}
                  </td>
                  <td className="px-3 py-2">{project.durationHours ? Number(project.durationHours).toFixed(2) : "-"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs">
                    {project.notificationTime
                      ? new Date(project.notificationTime).toLocaleString("zh-CN")
                      : "-"}
                  </td>
                  <td className="max-w-[150px] px-3 py-2 text-xs text-muted-foreground">
                    {editingCell?.projectId === project.id &&
                    editingCell?.field === "notes" ? (
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => handleCellSave(project.id, "notes")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCellSave(project.id, "notes");
                          if (e.key === "Escape") setEditingCell(null);
                        }}
                        className="w-full rounded border border-input bg-background px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="cursor-pointer hover:text-primary"
                        onClick={() => {
                          setEditingCell({ projectId: project.id, field: "notes" });
                          setEditingValue(project.notes ?? "");
                        }}
                      >
                        {project.notes ?? "-"}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("recordCount", { count: filteredProjects.length })}
      </p>
    </div>
  );

  // 渲染审计日志
  const renderAuditLogs = () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">{t("audit.actionType")}</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">{t("audit.description")}</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">{t("audit.ipAddress")}</th>
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">{t("audit.time")}</th>
            </tr>
          </thead>
          <tbody>
            {auditLogsData.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                  {t("audit.empty")}
                </td>
              </tr>
            ) : (
              auditLogsData.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs font-medium">
                      {isActionType(log.actionType)
                        ? t(`actions.${log.actionType}`)
                        : log.actionType}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">{log.description}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                    {log.ipAddress ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString("zh-CN")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 渲染备份管理
  const renderBackup = () => (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <h4 className="text-sm font-medium">{t("backup.notesTitle")}</h4>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>• {t("backup.note1")}</li>
          <li>• {t("backup.note2")}</li>
          <li>• {t("backup.note3")}</li>
          <li>• {t("backup.note4")}</li>
        </ul>
      </div>

      <button
        type="button"
        onClick={handleBackup}
        disabled={backupStatus === "loading"}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {backupStatus === "loading" ? tc("processing") : t("backup.trigger")}
      </button>
      {backupStatus === "success" && (
        <p className="text-xs text-green-600">{t("backup.success")}</p>
      )}
      {backupStatus === "error" && (
        <p className="text-xs text-red-600">{t("backup.failedRetry")}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-background p-5">
        <h3 className="font-semibold text-foreground">{t("title")}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{t("description")}</p>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition " +
              (activeTab === tab.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {t(`tabs.${tab.key}`)}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="rounded-2xl border border-border bg-background p-5">
        {activeTab === "data" && renderDataTable()}
        {activeTab === "audit" && renderAuditLogs()}
        {activeTab === "backup" && renderBackup()}
      </div>
    </div>
  );
}