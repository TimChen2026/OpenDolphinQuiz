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

// Dashboard 控制台外壳(Phase 3 验收修订)
//
// 布局:
// - 桌面:左侧边栏导航 + 右侧内容区
// - 手机:顶部横向 Tab 栏(内容手机优先展示)
//
// Tab(验收报告修订):
// 项目看板 / 交互界面 / 逻辑界面 / 报告模板 / 团队界面 / 邮件设置 / 链接生成 / 数据库 / 数据分析
//
// 交互界面与逻辑界面合并为一页(用户需求):
// - 交互界面(问卷编辑器)排列在上,逻辑界面(节点图+输入表格)排列在下
// - 左侧保留「交互界面」「逻辑界面」两个菜单项,均进入该合并页面,
//   点击「逻辑界面」时滚动定位到页面下方逻辑界面区块

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PanelLeft, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { LocaleLink } from "@/components/locale-link";
import { InteractionView } from "./interaction-view";
import { InteractionEditorView } from "./interaction-editor-view";
import { LogicView } from "./logic-view";
import { ReportTemplatesView } from "./report-templates-view";
import { TeamView } from "./team-view";
import { WarningSettingsView } from "./warning-settings-view";
import { LinkGenView } from "./link-gen-view";
import { DatabaseView } from "./database-view";
import { AnalysisView } from "./analysis-view";

// Tab 定义(label 文案走 dashboard.views.shell.tabs.{key} 翻译键)
const TABS = [
  { key: "kanban" },
  { key: "interaction" },
  { key: "logic" },
  { key: "report" },
  { key: "team" },
  { key: "warning" },
  { key: "link" },
  { key: "database" },
  { key: "analysis" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function DashboardShell() {
  const t = useTranslations("dashboard.views.shell");
  const [activeTab, setActiveTab] = useState<TabKey>("kanban");
  // 侧边栏是否折叠(最小化为窄条,仅保留展开按钮)
  const [collapsed, setCollapsed] = useState(false);

  // 「更新及检查」完成后会刷新网页,并写入提示"刷新后进入逻辑界面"的意图;
  // 此处在挂载后读取该意图,直接切到逻辑界面(复用下方滚动定位逻辑),
  // 效果相当于手动刷新后再点击仪表盘「逻辑界面」
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const storedTab = window.sessionStorage.getItem("dolphin_active_tab");
    if (storedTab === "logic") {
      window.sessionStorage.removeItem("dolphin_active_tab");
      // 仅在挂载时一次性从会话还原焦点标签,非循环级联渲染,豁免校验
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab("logic");
    }
  }, []);

  // 当前选中节点(交互界面「i.通过选项选择节点」/手机预览/主题词编辑 与
  // 逻辑界面节点图/节点内容编辑表格 共享联动,统一由这里管理)
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");

  // 点击「逻辑界面」菜单时滚动到合并页面的逻辑界面区块;
  // 点击「交互界面」时回到合并页面顶部(合并页面两个菜单共用,通过滚动定位区分入口)
  // 说明:
  // - 与「交互界面」分支对称,统一使用 window.scrollTo 定位(scrollIntoView 在滚动
  //   过程中再次触发时部分环境下不生效)
  // - 从其他菜单首次切入时合并页面刚挂载,子组件仍在加载,区块位置会随后续内容
  //   渲染而变化,因此立即定位一次后延迟补充定位,保证最终停在逻辑界面区块
  // - 96px = 顶部导航高度,与 logic-section 的 scroll-mt-24 一致,避免区块标题被遮挡
  useEffect(() => {
    if (activeTab === "logic") {
      const scrollToLogic = () => {
        const section = document.getElementById("logic-section");
        if (!section) {
          return;
        }
        const top =
          section.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
      };
      scrollToLogic();
      const timers = [400, 1200].map((ms) =>
        window.setTimeout(scrollToLogic, ms)
      );
      return () => timers.forEach((timer) => window.clearTimeout(timer));
    }
    if (activeTab === "interaction") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeTab]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 lg:flex-row">
      {/* 侧边栏导航(桌面);折叠时收窄为仅展开按钮 */}
      <aside className={cn("lg:flex-shrink-0 transition-all", collapsed ? "lg:w-10" : "lg:w-52")}>
        <nav
          className={cn(
            "flex gap-2 overflow-x-auto pb-2 lg:sticky lg:top-24 lg:flex-col lg:overflow-visible lg:pb-0 lg:transition-opacity",
            collapsed && "lg:items-center"
          )}
        >
          {/* 折叠/展开切换按钮 */}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={
              collapsed ? t("expandSidebar") : t("collapseSidebar")
            }
            title={collapsed ? t("expandSidebar") : t("collapseSidebar")}
            className="flex flex-shrink-0 items-center justify-center rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </button>

          {!collapsed && (
            <>
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition lg:rounded-xl lg:px-4 lg:py-2.5 lg:text-left",
                    activeTab === tab.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {t(`tabs.${tab.key}`)}
                </button>
              ))}
              {/* 快速上手文档入口:非 Tab,点击跳转到当前语言的 /docs/quickstart */}
              <LocaleLink
                href="/docs/quickstart"
                className="flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition text-muted-foreground hover:bg-muted hover:text-foreground lg:rounded-xl lg:px-4 lg:py-2.5 lg:text-left"
              >
                {t("quickstartLink")}
              </LocaleLink>
            </>
          )}
        </nav>
      </aside>

      {/* 内容区 */}
      <main className="min-w-0 flex-1">
        {activeTab === "kanban" && <InteractionView />}
        {/* 交互界面与逻辑界面合并为一页:交互界面(问卷编辑器)在上,逻辑界面(节点图+输入表格)在下;
            两个菜单项共用该页面,点击「逻辑界面」滚动定位到下方区块 */}
        {(activeTab === "interaction" || activeTab === "logic") && (
          <div className="space-y-8">
            <section aria-label={t("sectionInteraction")}>
              <InteractionEditorView
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
              />
            </section>
            <section id="logic-section" aria-label={t("sectionLogic")} className="scroll-mt-24">
              <LogicView
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
              />
            </section>
          </div>
        )}
        {activeTab === "report" && <ReportTemplatesView />}
        {activeTab === "team" && <TeamView />}
        {activeTab === "warning" && <WarningSettingsView />}
        {activeTab === "link" && <LinkGenView />}
        {activeTab === "database" && <DatabaseView />}
        {activeTab === "analysis" && <AnalysisView />}
      </main>
    </div>
  );
}
