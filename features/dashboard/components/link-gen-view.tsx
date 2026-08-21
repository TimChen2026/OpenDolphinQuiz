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

// Dashboard 链接生成(Phase 3 验收修订 2.1.8)
//
// 两步操作:
// 1. 检查:程序生成链接前进行内部检查,确认问卷信息齐备;不齐备时展示缺失项
// 2. 生成:点击"生成链接"按钮产生 Quiz 问卷链接,供用户复制提供给客户

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/button";

// 检查结果类型
type LinkCheckIssue = {
  nodeId: string;
  level: string;
  message: string;
};

type CheckResult = {
  ok: boolean;
  issues: LinkCheckIssue[];
  templateId?: string;
};

// ==================== Quiz 问卷方案保存 ====================
// 方案 = 当前问卷完整配置(模板 ID + 全部节点/选项)+ 风格 + 保存时间。
// 存储于浏览器 localStorage(键 dolphin_quiz_plans),还原时写回当前问卷模板。

// 风格 ID → 中文名映射(与交互界面 STYLE_TEMPLATES 对齐)
const STYLE_LABELS: Record<string, string> = {
  classic: "Oxford 深蓝",
  princeton: "Princeton 橙",
  yale: "Yale 蓝",
  stanford: "Stanford 红",
  mit: "MIT 科技",
  harvard: "Harvard 深红",
  system: "跟随系统",
};

// 方案类型
type QuizPlan = {
  id: string;
  name: string;
  savedAt: number;
  styleId: string;
  templateId: string;
  nodes: PlanNode[];
};

// 方案节点(来源于 /api/dashboard/template 的可编辑数据,还原时写入模板)
type PlanNode = {
  id: string;
  level: string;
  question: string;
  options: PlanOption[];
};

type PlanOption = {
  id: string;
  optionText: string;
  targetNodeId: string | null;
  resultTheme: string | null;
  resultManagerId: string | null;
};

const PLANS_STORAGE_KEY = "dolphin_quiz_plans";
const MAX_PLANS = 12;

export function LinkGenView() {
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [checked, setChecked] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const runCheck = useCallback(async () => {
    setChecking(true);
    setCheckResult(null);
    setChecked(false);
    setGeneratedLink(null);
    try {
      const res = await fetch("/api/dashboard/link-check");
      const json = (await res.json()) as CheckResult;
      setCheckResult(json);
      setChecked(true);
    } catch {
      setCheckResult({
        ok: false,
        issues: [{ nodeId: "", level: "-", message: "检查请求失败,请重试" }],
      });
      setChecked(true);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  /** 生成问卷链接(检查通过后才允许),链接携带模板 ID 与选定风格,以精确展示当前租户系统设置(验收修订 2.1.8-b) */
  const handleGenerate = () => {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const templateId = checkResult?.templateId;
    // 读取已保存的 Quiz 风格(从交互界面「确定」按钮写入 sessionStorage)
    let style = "";
    try {
      style = window.sessionStorage.getItem("dolphin_quiz_style") ?? "";
    } catch {
      style = "";
    }
    const params = new URLSearchParams();
    if (templateId) {
      params.set("t", templateId);
    }
    if (style) {
      params.set("style", style);
    }
    const qs = params.toString();
    setGeneratedLink(`${baseUrl}/quiz${qs ? `?${qs}` : ""}`);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!generatedLink) {
      return;
    }
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 剪贴板不可用时提示用户手动复制
      setCopied(false);
    }
  };

  // ==================== 问卷方案保存/还原状态 ====================
  const [plans, setPlans] = useState<QuizPlan[]>([]);
  const [planLoaded, setPlanLoaded] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planMsg, setPlanMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [renamePlanId, setRenamePlanId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // 从 localStorage 读取已保存方案
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PLANS_STORAGE_KEY);
      setPlans(raw ? (JSON.parse(raw) as QuizPlan[]) : []);
    } catch {
      setPlans([]);
    }
    setPlanLoaded(true);
  }, []);

  // 持久化方案列表到 localStorage
  const persistPlans = (next: QuizPlan[]) => {
    try {
      window.localStorage.setItem(PLANS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage 不可用(如超限)时方案仅存于内存,不影响页面
    }
    setPlans(next);
  };

  // 读取当前选中风格(与链接生成使用的来源一致)
  const readStyleId = () => {
    try {
      return window.sessionStorage.getItem("dolphin_quiz_style") ?? "classic";
    } catch {
      return "classic";
    }
  };

  /** 保存当前问卷为一个方案(拉取模板完整数据 + 当前风格) */
  const handleSavePlan = async () => {
    setSavingPlan(true);
    setPlanMsg(null);
    try {
      const res = await fetch("/api/dashboard/template");
      if (!res.ok) {
        throw new Error(`获取问卷数据失败(${res.status})`);
      }
      const json = (await res.json()) as {
        template?: { id: string; nodes: PlanNode[] | null };
      };
      const template = json.template;
      if (!template?.id || !template.nodes) {
        throw new Error("未能获取当前问卷模板");
      }

      const baseName = `问卷方案 ${plans.length + 1}`;
      const plan: QuizPlan = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: baseName,
        savedAt: Date.now(),
        styleId: readStyleId(),
        templateId: template.id,
        nodes: template.nodes,
      };

      const next = [plan, ...plans].slice(0, MAX_PLANS);
      // 仅当「新增前已满 12 个」时才会因 slice 丢弃最旧方案,此时给出提示
      if (plans.length >= MAX_PLANS) {
        setPlanMsg({
          type: "error",
          text: `方案已达${MAX_PLANS}个上限,已自动删除最旧的方案`,
        });
      } else {
        setPlanMsg({ type: "success", text: `方案「${baseName}」已保存` });
      }
      persistPlans(next);
      setSelectedPlanId(plan.id);
    } catch (error) {
      setPlanMsg({
        type: "error",
        text: error instanceof Error ? error.message : "保存方案失败",
      });
    } finally {
      setSavingPlan(false);
    }
  };

  /** 还原方案:把方案快照写回当前问卷模板,并应用其风格 */
  const handleRestorePlan = async (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      return;
    }
    setPlanMsg(null);
    setSavingPlan(true);
    try {
      const nodeSaves = plan.nodes.map((n) => ({ id: n.id, question: n.question }));
      const optionSaves = plan.nodes.flatMap((n) =>
        n.options.map((o) => ({
          id: o.id,
          optionText: o.optionText,
          targetNodeId: o.targetNodeId,
          resultTheme: o.resultTheme,
          resultManagerId: o.resultManagerId,
        }))
      );
      const res = await fetch("/api/dashboard/template/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: plan.templateId,
          nodes: nodeSaves,
          options: optionSaves,
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "还原方案失败");
      }
      // 应用方案风格到 sessionStorage(影响后续链接生成)
      try {
        window.sessionStorage.setItem("dolphin_quiz_style", plan.styleId);
      } catch {
        // sessionStorage 不可用时忽略
      }
      setPlanMsg({ type: "success", text: `方案「${plan.name}」已还原并应用` });
    } catch (error) {
      setPlanMsg({
        type: "error",
        text: error instanceof Error ? error.message : "还原方案失败",
      });
    } finally {
      setSavingPlan(false);
    }
  };

  /** 删除方案 */
  const handleDeletePlan = (planId: string) => {
    persistPlans(plans.filter((p) => p.id !== planId));
    if (selectedPlanId === planId) {
      setSelectedPlanId(null);
    }
    if (renamePlanId === planId) {
      setRenamePlanId(null);
    }
    setPlanMsg({ type: "success", text: "方案已删除" });
  };

  /** 重命名方案 */
  const handleRenameSubmit = (planId: string) => {
    const name = renameValue.trim();
    if (!name) {
      setRenamePlanId(null);
      return;
    }
    persistPlans(
      plans.map((p) => (p.id === planId ? { ...p, name } : p))
    );
    setRenamePlanId(null);
    setPlanMsg({ type: "success", text: "方案已重命名" });
  };

  // 时间格式化
  const formatPlanTime = (ts: number) => {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${hh}:${mm}`;
  };

  return (
    <div className="space-y-6">
      {/* 第一步:检查 */}
      <div className="rounded-2xl border border-border bg-background p-5">
        <h3 className="font-semibold text-foreground">1. 检查问卷信息</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          生成链接前,系统自动检查问卷的信息是否齐备(问题、选项、主题词、销售经理关联)
        </p>

        <div className="mt-4 flex items-center gap-4">
          <Button variant="outline" onClick={runCheck} disabled={checking}>
            {checking ? "检查中..." : "重新检查"}
          </Button>
          {checked && checkResult && (
            <span
              className={
                checkResult.ok
                  ? "text-sm text-green-600"
                  : "text-sm text-amber-600"
              }
            >
              {checkResult.ok
                ? "检查通过,问卷信息齐备"
                : `检查未通过,共 ${checkResult.issues.length} 项待完善`}
            </span>
          )}
        </div>

        {/* 缺失项列表 */}
        {checked && checkResult && !checkResult.ok && (
          <ul className="mt-4 space-y-2">
            {checkResult.issues.map((issue, index) => (
              <li
                key={`${issue.nodeId}-${index}`}
                className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-700"
              >
                <span className="flex-shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {issue.level}
                </span>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 第二步:生成 */}
      <div className="rounded-2xl border border-border bg-background p-5">
        <h3 className="font-semibold text-foreground">2. 生成问卷链接</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          检查通过后,点击「生成链接」产生 Quiz 问卷链接,可提供给客户访问
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Button onClick={handleGenerate} disabled={!checkResult?.ok}>
            生成链接
          </Button>
          {!checkResult?.ok && (
            <span className="text-xs text-muted-foreground">
              请先完善上方缺失项后再生成
            </span>
          )}
        </div>

        {generatedLink && (
          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Quiz 问卷链接</p>
              <p className="mt-1 break-all font-mono text-sm text-foreground">
                {generatedLink}
              </p>
            </div>
            <Button variant="outline" onClick={handleCopy}>
              {copied ? "已复制" : "复制链接"}
            </Button>
          </div>
        )}
      </div>

      {/* 第三步:Quiz 问卷方案保存与还原 */}
      <div className="rounded-2xl border border-border bg-background p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-foreground">3. Quiz 问卷保存</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              最多保存 {MAX_PLANS} 个问卷方案,页面仅展示方案名称;点击可查看保存时间与风格,支持重命名与还原
            </p>
          </div>
          <Button
            onClick={handleSavePlan}
            disabled={savingPlan || !checkResult?.ok}
          >
            {savingPlan ? "处理中..." : "保存当前方案"}
          </Button>
        </div>

        {/* 操作提示 */}
        {planMsg && (
          <p
            className={
              planMsg.type === "success"
                ? "mt-3 text-sm text-green-600"
                : "mt-3 text-sm text-amber-600"
            }
          >
            {planMsg.text}
          </p>
        )}

        {!checkResult?.ok && !checking && (
          <p className="mt-3 text-xs text-muted-foreground">
            请先通过上方检查后再保存方案
          </p>
        )}

        {/* 方案列表 */}
        <div className="mt-4">
          {planLoaded && plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无已保存的方案</p>
          ) : (
            <ul className="space-y-2">
              {plans.map((plan) => (
                <li
                  key={plan.id}
                  className="overflow-hidden rounded-lg border border-border bg-muted/30"
                >
                  {/* 方案名称行:点击展开查看详情;重命名时显示输入框 */}
                  <div className="flex items-center gap-2 px-3 py-2">
                    {renamePlanId === plan.id ? (
                      <>
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleRenameSubmit(plan.id);
                            }
                            if (e.key === "Escape") {
                              setRenamePlanId(null);
                            }
                          }}
                          className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus:outline-none"
                          placeholder="输入新方案名称"
                        />
                        <button
                          type="button"
                          onClick={() => handleRenameSubmit(plan.id)}
                          className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
                        >
                          保存
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenamePlanId(null)}
                          className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground"
                        >
                          取消
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left text-sm font-medium text-foreground hover:text-primary"
                          onClick={() =>
                            setSelectedPlanId(
                              selectedPlanId === plan.id ? null : plan.id
                            )
                          }
                        >
                          <span className="truncate">{plan.name}</span>
                        </button>
                        <button
                          type="button"
                          title="重命名"
                          onClick={() => {
                            setRenamePlanId(plan.id);
                            setRenameValue(plan.name);
                          }}
                          className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          重命名
                        </button>
                        <button
                          type="button"
                          title="删除方案"
                          onClick={() => handleDeletePlan(plan.id)}
                          className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-red-600"
                        >
                          删除
                        </button>
                      </>
                    )}
                  </div>

                  {/* 选中后展开显示时间/风格 + 还原 */}
                  {selectedPlanId === plan.id && renamePlanId !== plan.id && (
                    <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                      <p>保存时间:{formatPlanTime(plan.savedAt)}</p>
                      <p className="mt-1">
                        风格:{STYLE_LABELS[plan.styleId] ?? plan.styleId}
                      </p>
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          onClick={() => handleRestorePlan(plan.id)}
                          disabled={savingPlan}
                        >
                          还原此方案
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 使用说明 */}
      <div className="rounded-2xl border border-border bg-background p-5 text-xs text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">使用说明:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>客户点击链接后进入 Quiz 问卷,按逻辑链条 P1→P2→P3→P4 进行问答</li>
          <li>客户在 P4 页点击「返回开始」后,系统建立项目编号并发送询盘通知邮件</li>
          <li>问卷内容修改后,建议重新执行一次检查再分享链接</li>
        </ul>
      </div>
    </div>
  );
}
