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

// Dashboard 团队界面(Phase 3 验收修订 2.1.7.5/2.1.8.1)
//
// 功能:
// - 销售总监设置(询盘/预警邮件抄送对象)
// - 销售经理列表(添加/删除)
// - 销售经理负责的主题多选(经理可负责多个主题),保存后写入数据库
// - "增加销售经理"按钮

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";
import type { SalesManager } from "@/features/dashboard/types";

type Director = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
};

type TeamData = {
  managers: SalesManager[];
  director: Director | null;
  themes: string[];
  managerThemes: Record<string, string[]>;
};

export function TeamView() {
  const [data, setData] = useState<TeamData | null>(null);
  const [newManagerEmail, setNewManagerEmail] = useState("");
  const [directorEmail, setDirectorEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [savingManagerId, setSavingManagerId] = useState<string | null>(null);
  // 电话编辑状态(userId -> 输入值)
  const [phoneInputs, setPhoneInputs] = useState<Record<string, string>>({});
  const [savingPhoneId, setSavingPhoneId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/team");
      if (!res.ok) {
        throw new Error("加载失败");
      }
      const json = (await res.json()) as TeamData;
      setData(json);
      // 初始化电话输入框
      const initial: Record<string, string> = {};
      for (const m of json.managers) {
        initial[m.id] = m.phone ?? "";
      }
      if (json.director) {
        initial[json.director.id] = json.director.phone ?? "";
      }
      setPhoneInputs(initial);
    } catch {
      setMessage({ type: "error", text: "加载团队数据失败" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** 切换经理的主题勾选(本地状态) */
  const toggleTheme = (managerId: string, theme: string) => {
    setData((prev) => {
      if (!prev) {
        return prev;
      }
      const current = new Set(prev.managerThemes[managerId] ?? []);
      if (current.has(theme)) {
        current.delete(theme);
      } else {
        current.add(theme);
      }
      return {
        ...prev,
        managerThemes: {
          ...prev.managerThemes,
          [managerId]: Array.from(current),
        },
      };
    });
  };

  /** 保存经理负责的主题 */
  const handleSaveManagerThemes = async (managerId: string) => {
    const themes = data?.managerThemes[managerId] ?? [];
    setSavingManagerId(managerId);
    setMessage(null);
    try {
      const res = await fetch("/api/dashboard/team/themes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId, themes }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error ?? "保存失败");
      }
      setMessage({ type: "success", text: "主题分配已保存" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "保存失败",
      });
    } finally {
      setSavingManagerId(null);
    }
  };

  /** 添加销售经理 */
  const handleAddManager = async () => {
    if (!newManagerEmail.trim()) {
      setMessage({ type: "error", text: "请输入销售经理邮箱" });
      return;
    }
    setMessage(null);
    try {
      const res = await fetch("/api/dashboard/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newManagerEmail }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error ?? "添加失败");
      }
      setNewManagerEmail("");
      setMessage({ type: "success", text: "销售经理已添加" });
      await fetchData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "添加失败",
      });
    }
  };

  /** 删除销售经理 */
  const handleRemoveManager = async (userId: string) => {
    setMessage(null);
    try {
      const res = await fetch(
        `/api/dashboard/team?userId=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error ?? "移除失败");
      }
      setMessage({ type: "success", text: "销售经理已移除" });
      await fetchData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "移除失败",
      });
    }
  };

  /** 设置销售总监 */
  const handleSetDirector = async () => {
    if (!directorEmail.trim()) {
      setMessage({ type: "error", text: "请输入销售总监邮箱" });
      return;
    }
    setMessage(null);
    try {
      // 通过邮箱找到用户并设置为总监
      const res = await fetch("/api/dashboard/team");
      if (!res.ok) {
        throw new Error("加载用户失败");
      }
      const json = (await res.json()) as TeamData & { managers: SalesManager[] };
      const managerList = json.managers;
      // 总监候选:现有经理或系统用户。MVP:通过邮箱查找已注册用户
      const target = managerList.find(
        (m) => m.email.toLowerCase() === directorEmail.trim().toLowerCase()
      );
      if (!target) {
        // 若不在经理列表中,尝试添加该用户为经理后设为总监
        setMessage({
          type: "error",
          text: "未找到该用户,请先在系统中注册",
        });
        return;
      }
      const dirRes = await fetch("/api/dashboard/director", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: target.id }),
      });
      const dirJson = await dirRes.json().catch(() => null);
      if (!dirRes.ok) {
        throw new Error(dirJson?.error ?? "设置失败");
      }
      setDirectorEmail("");
      setMessage({ type: "success", text: "销售总监已设置" });
      await fetchData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "设置失败",
      });
    }
  };

  /** 保存电话(验收修订 2.1.7.5:补充销售经理/总监电话输入框) */
  const handleSavePhone = async (userId: string) => {
    const phone = phoneInputs[userId] ?? "";
    setSavingPhoneId(userId);
    setMessage(null);
    try {
      const res = await fetch("/api/dashboard/team/phone", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, phone }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error ?? "保存失败");
      }
      setMessage({ type: "success", text: "电话已保存" });
      await fetchData();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "保存失败",
      });
    } finally {
      setSavingPhoneId(null);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-muted-foreground">加载中...</div>;
  }

  if (!data) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        暂无团队数据
      </div>
    );
  }

  const director = data.director;

  return (
    <div className="space-y-6">
      {/* 销售总监设置(2.1.8.1:邮件抄送销售总监) */}
      <div className="rounded-2xl border border-border bg-background p-5">
        <h3 className="font-semibold text-foreground">销售总监</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          销售总监将收到询盘通知与预警邮件的抄送(CC),负责管理层面跟进
        </p>

        {director ? (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {director.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {director.email}
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                当前销售总监
              </span>
            </div>
            {/* 总监电话输入框(验收修订 2.1.7.5) */}
            <div className="mt-3 flex items-center gap-2">
              <input
                value={phoneInputs[director.id] ?? ""}
                onChange={(e) =>
                  setPhoneInputs((prev) => ({
                    ...prev,
                    [director.id]: e.target.value,
                  }))
                }
                placeholder="销售总监电话"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={savingPhoneId === director.id}
                onClick={() => handleSavePhone(director.id)}
              >
                {savingPhoneId === director.id ? "保存中..." : "保存电话"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            尚未设置销售总监
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={directorEmail}
            onChange={(e) => setDirectorEmail(e.target.value)}
            placeholder="输入销售经理邮箱,将其设为销售总监"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
          <Button variant="outline" onClick={handleSetDirector}>
            设置销售总监
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          注:销售总监与销售经理可为同一人,输入销售经理邮箱即可将其设为总监
        </p>
      </div>

      {/* 销售经理列表(主题多选) */}
      <div className="rounded-2xl border border-border bg-background p-5">
        <h3 className="font-semibold text-foreground">销售经理</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          每位销售经理可负责多个主题(多选),保存后主题询盘将分配给对应经理
        </p>

        {data.managers.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            暂无销售经理,请添加
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {data.managers.map((manager) => {
              const managerThemes = data.managerThemes[manager.id] ?? [];
              return (
                <li key={manager.id} className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {manager.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {manager.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={savingManagerId === manager.id}
                        onClick={() => handleSaveManagerThemes(manager.id)}
                      >
                        {savingManagerId === manager.id ? "保存中..." : "保存"}
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleRemoveManager(manager.id)}
                        className="rounded-full px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                      >
                        移除
                      </button>
                    </div>
                  </div>

                  {/* 经理电话输入框(验收修订 2.1.7.5) */}
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      value={phoneInputs[manager.id] ?? ""}
                      onChange={(e) =>
                        setPhoneInputs((prev) => ({
                          ...prev,
                          [manager.id]: e.target.value,
                        }))
                      }
                      placeholder="销售经理电话"
                      className="flex-1 max-w-xs rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={savingPhoneId === manager.id}
                      onClick={() => handleSavePhone(manager.id)}
                    >
                      {savingPhoneId === manager.id ? "保存中..." : "保存电话"}
                    </Button>
                  </div>

                  {/* 主题多选 */}
                  <div className="mt-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      负责主题:
                    </p>
                    {data.themes.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        暂无主题(请在逻辑界面中为 P3 选项填写主题词)
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {data.themes.map((theme) => {
                          const checked = managerThemes.includes(theme);
                          return (
                            <button
                              key={theme}
                              type="button"
                              onClick={() => toggleTheme(manager.id, theme)}
                              className={cn(
                                "rounded-full border px-3 py-1 text-xs transition",
                                checked
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border text-muted-foreground hover:border-primary/50"
                              )}
                            >
                              {theme}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* 增加销售经理 */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={newManagerEmail}
            onChange={(e) => setNewManagerEmail(e.target.value)}
            placeholder="输入已注册用户邮箱"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
          <Button variant="outline" onClick={handleAddManager}>
            增加销售经理
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          注:需先让该用户在系统中注册,方可提升为销售经理
        </p>
      </div>

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
