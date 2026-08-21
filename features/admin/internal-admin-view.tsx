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

// 内部管理视图(Phase 3 验收修订 2.1.9)
//
// 功能:
// 1. 用户角色(RBAC)权限分配和控制
// 2. 询盘上限提醒邮件模板修改(图2.1.7.7-1 接近上限 / 图2.1.7.7-2 达到上限)
// 3. 提醒模板程序位置说明

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";

// 用户记录
type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

// 角色选项
const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "user", label: "普通用户" },
  { value: "sales_manager", label: "销售经理" },
  { value: "sales_director", label: "销售总监" },
  { value: "admin", label: "管理员" },
];

// 邮件模板
type EmailTemplateData = {
  templateType: string;
  name: string;
  subject: string;
  body: string;
};

export function InternalAdminView() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [templates, setTemplates] = useState<Record<string, EmailTemplateData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [savingType, setSavingType] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, templateRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/dashboard/email-templates"),
      ]);
      if (!userRes.ok || !templateRes.ok) {
        throw new Error("加载失败");
      }
      const userJson = (await userRes.json()) as { users: AdminUser[] };
      const templateJson = (await templateRes.json()) as {
        templates: Record<string, EmailTemplateData>;
      };
      setUsers(userJson.users);
      setTemplates(templateJson.templates);
    } catch {
      setMessage({ type: "error", text: "加载内部管理数据失败" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** 更新用户角色 */
  const handleUpdateRole = async (userId: string, role: string) => {
    setSavingRoleId(userId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error ?? "更新角色失败");
      }
      setMessage({ type: "success", text: "角色已更新" });
      await fetchData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "更新角色失败",
      });
    } finally {
      setSavingRoleId(null);
    }
  };

  /** 更新模板字段 */
  const updateTemplate = (type: string, field: "subject" | "body", value: string) => {
    setTemplates((prev) => {
      if (!prev || !prev[type]) {
        return prev;
      }
      return {
        ...prev,
        [type]: { ...prev[type], [field]: value },
      };
    });
  };

  /** 保存模板 */
  const handleSaveTemplate = async (type: string) => {
    const template = templates?.[type];
    if (!template) {
      return;
    }
    setSavingType(type);
    setMessage(null);
    try {
      const res = await fetch("/api/dashboard/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateType: type,
          subject: template.subject,
          body: template.body,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error ?? "保存失败");
      }
      setMessage({ type: "success", text: "模板已保存" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "保存失败",
      });
    } finally {
      setSavingType(null);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-muted-foreground">加载中...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          内部管理
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          开发团队内部页面:角色(RBAC)权限分配与询盘上限提醒模板管理(仅管理员可访问)
        </p>
      </div>

      {/* ===== 角色(RBAC)权限分配 ===== */}
      <section className="rounded-2xl border border-border bg-background p-5">
        <h2 className="font-semibold text-foreground">用户角色权限分配</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          为系统用户分配角色:管理员 / 销售总监 / 销售经理 / 普通用户
        </p>

        {!users || users.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">暂无用户</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">用户</th>
                  <th className="py-2 pr-4 font-medium">邮箱</th>
                  <th className="py-2 pr-4 font-medium">当前角色</th>
                  <th className="py-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/60">
                    <td className="py-2.5 pr-4 font-medium text-foreground">
                      {u.name}
                    </td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {u.email}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                        {ROLE_OPTIONS.find((r) => r.value === u.role)?.label ??
                          u.role}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <select
                        value={u.role}
                        disabled={savingRoleId === u.id}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className={cn(
                          "rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary",
                          savingRoleId === u.id && "opacity-50"
                        )}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ===== 询盘上限提醒模板 ===== */}
      <section className="rounded-2xl border border-border bg-background p-5">
        <h2 className="font-semibold text-foreground">询盘上限提醒模板</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          严格按需求文档图 2.1.7.7-1(接近上限)/ 图 2.1.7.7-2(达到上限)模板设置
        </p>

        {templates &&
          ["inquiry_near_limit", "inquiry_reach_limit"].map((type) => {
            const template = templates[type];
            if (!template) {
              return null;
            }
            return (
              <div
                key={type}
                className="mt-4 rounded-xl border border-border p-4"
              >
                <h3 className="text-sm font-medium text-foreground">
                  {template.name}
                </h3>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      邮件主题
                    </label>
                    <input
                      value={template.subject}
                      onChange={(e) =>
                        updateTemplate(type, "subject", e.target.value)
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      邮件正文
                    </label>
                    <textarea
                      value={template.body}
                      onChange={(e) =>
                        updateTemplate(type, "body", e.target.value)
                      }
                      rows={6}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={savingType === type}
                    onClick={() => handleSaveTemplate(type)}
                  >
                    {savingType === type ? "保存中..." : "保存模板"}
                  </Button>
                </div>
              </div>
            );
          })}
      </section>

      {/* ===== 模板位置说明 ===== */}
      <section className="rounded-2xl border border-border bg-background p-5 text-xs text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">
          提醒模板在程序中的位置说明:
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li>
            默认模板定义:
            <code className="rounded bg-muted px-1.5 py-0.5">
              lib/dashboard/email-templates.ts
            </code>
            (inquiry_near_limit / inquiry_reach_limit)
          </li>
          <li>
            触发逻辑:
            <code className="rounded bg-muted px-1.5 py-0.5">
              lib/dashboard/inquiry-limit.ts
            </code>
            (≥3 次发送接近上限邮件,≥5 次发送达到上限邮件)
          </li>
          <li>
            本页面修改后即时生效,下次触发时使用新模板。该模板仅供开发团队内部调整,
            不开放给用户(验收修订 2.1.9-b)
          </li>
        </ul>
      </section>

      {message && (
        <p
          className={
            message.type === "success"
              ? "text-sm text-green-600"
              : "text-sm text-destructive"
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
