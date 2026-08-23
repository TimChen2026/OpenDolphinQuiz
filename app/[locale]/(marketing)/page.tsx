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

import Link from "next/link";
import { Container } from "@/components/container";
import { VideoDemoModal } from "@/components/video-demo-modal";
import { Metadata } from "next";
import { getTranslations } from 'next-intl/server';
import type { Locale } from "@/i18n.config";
import { generatePageMetadata } from "@/lib/metadata";
import {
  getActiveClientTemplate,
  getUserTenantIdByEmail,
} from "@/lib/quiz/queries";
import {
  getEmailTemplatesByTenant,
  EMAIL_TEMPLATE_TYPES,
} from "@/lib/dashboard/email-templates";
import { QuizDemoPhone } from "@/features/quiz/components/quiz-demo-phone";
import {
  MessageCircle,
  GitBranch,
  BarChart3,
  Send,
  Users,
  TrendingUp,
} from "lucide-react";

// 演示租户:主页 Quiz 演示展示该租户仪表盘配置的激活模板,
// 与其生成的 Quiz 链接(/quiz?t=...)内容保持一致;仪表盘修改模板后主页自动同步
const DEMO_TENANT_EMAIL = "huiting.chen@outlook.com";

// 主页 Quiz 演示需跟随仪表盘模板变更,60 秒内重新验证(ISR,生产环境生效)
export const revalidate = 60;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: Locale }>;
  }
): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'hero' });

  return generatePageMetadata({
    locale,
    path: '',
    title: t('title'),
    description: t('description'),
  });
}

/**
 * 主页各区域插图的静态资源路径(存放于 public/home/ 目录,随部署分发)
 * 此前从"项目需求文档/"目录读取本地文件,该目录被 .gitignore 忽略,
 * 导致线上部署后插图缺失;改为静态资源后本地与线上统一。
 */
const PAIN_POINT_IMAGE = "/home/painpoint.jpg";
const SERVICE_IMAGE = "/home/service.jpg";
const OPEN_SOURCE_IMAGE = "/home/opensource.jpg";
const ANALYTICS_IMAGE = "/home/analytics.jpg";

/**
 * 加载主页演示用的 Quiz 模板与 Summary 摘要模板
 *
 * 数据源与真实 Quiz 页(/quiz?t=...)完全相同:
 * - 激活 Quiz 模板(问题/选项/流转)按演示租户加载
 * - Summary 摘要取该租户的报告模板 summary 类型
 *
 * 加载失败时返回 null,主页手机框显示占位提示(不阻塞页面渲染)
 */
async function loadQuizDemoData() {
  try {
    const tenantId = await getUserTenantIdByEmail(DEMO_TENANT_EMAIL);
    if (!tenantId) {
      return null;
    }
    const template = await getActiveClientTemplate(tenantId);
    if (!template) {
      return null;
    }
    const templates = await getEmailTemplatesByTenant(tenantId);
    const summary = templates[EMAIL_TEMPLATE_TYPES.SUMMARY];
    return {
      template,
      summaryTemplate: summary
        ? { subject: summary.subject, body: summary.body }
        : null,
    };
  } catch (error) {
    console.error("加载主页 Quiz 演示数据失败:", error);
    return null;
  }
}

export default async function Home() {
  const demoData = await loadQuizDemoData();

  return (
    <div className="relative">
      {/* Hero 区域 */}
      <section className="min-h-screen flex items-center pt-16 bg-background">
        <Container className="w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* 左侧文字 */}
            <div className="flex flex-col gap-8 py-8 lg:py-12">
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight font-display text-primary">
                双闭环驱动增长，而且免费！
              </h1>
              <p className="text-xl lg:text-2xl leading-relaxed text-muted-foreground">
                i. 即时销售响应 ii. 实时管理洞察
              </p>
              <p className="text-base leading-relaxed text-muted-foreground/70">
                让流量和广告的价值充分体现
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold rounded-lg transition-all hover:opacity-90 bg-primary text-primary-foreground"
                >
                  免费开始使用
                </Link>
                {/* 介绍短片按钮:点击弹出 Mux 视频播放,不影响页面布局 */}
                <VideoDemoModal />
              </div>
            </div>

            {/* 右侧 Quiz 预览卡片 — 手机外框 */}
            <div className="flex flex-col justify-center lg:justify-end">
              <div className="relative mx-auto w-[296px] h-[530px] bg-black/90 dark:bg-gray-900 rounded-[2.5rem] px-[6px] py-[6px] shadow-2xl border border-gray-700/50">
                {/* 顶部听筒+摄像头（动态岛风格） */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-3 w-[100px] h-[28px] bg-black rounded-b-2xl">
                  <div className="w-2 h-2 rounded-full bg-gray-700 border border-gray-600" />
                </div>
                {/* 屏幕区域:Quiz 演示(与仪表盘生成链接 /quiz?t=... 内容一致) */}
                <div className="bg-card rounded-[2.2rem] overflow-hidden border border-border/50 pt-4 h-[508px] w-[282px]">
                  {demoData ? (
                    <QuizDemoPhone
                      template={demoData.template}
                      summaryTemplate={demoData.summaryTemplate}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                      Quiz 演示暂不可用,请稍后再试
                    </div>
                  )}
                </div>
                {/* 底部 Home Indicator */}
                <div className="flex justify-center py-1">
                  <div className="w-[120px] h-[4px] bg-white/40 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 痛点区域 */}
      <section className="py-24 bg-card">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-display text-foreground">
              我们专注于教育，针对性进行数据分析
            </h2>
            <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
              ★ 释放数据潜力，指导和优化工作，提供决策参考
            </p>
            <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
              ★ 为 Pro 和 Max 用户提供多达 10 种图表分析，以及每月、每季、每年的分析报告，物超所值！
            </p>
          </div>
          {/* 痛点区域：用图表图片替换原三张卡片，图片四周柔化过渡与网页自然融合 */}
          <div className="relative overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PAIN_POINT_IMAGE}
              alt="教育机构经营痛点图表"
              className="w-full h-full object-cover"
            />
          </div>
        </Container>
      </section>

      {/* 功能区域 */}
      <section className="py-24 bg-background">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-display text-foreground">
              免费! 您就可以获得24小时服务
            </h2>
            <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
              DolphinQuiz大大减轻客户服务团队的压力，而且不间断
            </p>
          </div>
          <div className="relative overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={SERVICE_IMAGE}
              alt="双闭环管理服务流程图"
              className="w-full h-full object-cover [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)]"
            />
          </div>
        </Container>
      </section>

      {/* 使用步骤 */}
      <section className="py-24 bg-card">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-display text-foreground">
              开源与社区共建，让先进生产力惠及每一个人
            </h2>
          </div>
          {/* 开源社区区域：用图片替换原三步卡片，四周柔化过渡与网页自然融合 */}
          <div className="relative overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={OPEN_SOURCE_IMAGE}
              alt="开源与社区共建"
              className="w-full h-full object-cover [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)]"
            />
          </div>
        </Container>
      </section>

      {/* （d）	DolphinQuiz是桥梁，连通你我 */}
      <section className="py-24 bg-background">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-display text-foreground">
              DolphinQuiz是桥梁, 连通您和我
            </h2>
            <p className="text-lg max-w-2xl mx-auto text-muted-foreground">
              通过DolphinQuiz, 我们更加了解客户, 沟通更加顺畅有效;
            </p>
          </div>
          {/* 数据分析区域：用图表图片替换原四卡片，四周柔化过渡与网页自然融合 */}
          <div className="relative overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ANALYTICS_IMAGE}
              alt="数据分析优化经营工作"
              className="w-full h-full object-cover [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)]"
            />
          </div>
        </Container>
      </section>

      {/* CTA 行动号召 */}
      <section className="py-24 bg-primary">
        <Container className="max-w-4xl text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-10 font-display text-primary-foreground">
            准备好让每个商机都转化为成交了吗？
          </h2>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold rounded-lg transition-all hover:opacity-90 bg-accent text-primary"
          >
            免费开始使用
          </Link>
        </Container>
      </section>
    </div>
  );
}