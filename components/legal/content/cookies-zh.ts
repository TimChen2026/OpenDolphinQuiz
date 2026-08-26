/*
 * Copyright (C) 2026 DolphinQuiz
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * 《Cookie 政策》中文版内容。依据《隐私政策》第 4 条（Cookie 和追踪技术）及第 10 条
 * （第三方服务提供商）编写，与定稿协议保持一致，禁止与《隐私政策》《服务条款》矛盾。
 */

import type { LegalDocumentContent } from "@/components/legal/legal-document";

export const cookiesZhContent: LegalDocumentContent = {
  title: "Cookie 政策",
  updated: "最后更新：2026-8-27（v1.0）",
  intro: [
    "Chen Huiting（以下简称\"CHT\"、\"我们\"或\"本人\"）在 dolphinquiz.com（\"本网站\"）使用 Cookie 及类似追踪技术。本政策说明我们使用哪些类型的 Cookie、它们的用途，以及您可以如何管理这些 Cookie。",
    "本政策是《隐私政策》（https://dolphinquiz.com/privacy）的配套文件，其中关于 Cookie 与追踪技术的核心约定见《隐私政策》第 4 条。继续使用本网站，即表示您同意按本政策所述方式使用 Cookie。如您不同意，请通过浏览器设置禁用 Cookie（详见第 6 条）。",
  ],
  sections: [
    {
      heading: "1. 什么是 Cookie 及类似技术",
      blocks: [
        "Cookie 是网站在您访问时存储在您设备（电脑、手机或平板）上的小型文本文件，广泛用于让网站正常运行并向网站运营方提供统计信息。",
        "类似技术还包括本地存储（localStorage）、像素标签（pixel）、网页信标等。在本政策中，上述技术统称为\"Cookie\"。",
      ],
    },
    {
      heading: "2. 我们使用的 Cookie 类型",
      blocks: [
        {
          headers: ["类型", "用途", "可关闭"],
          rows: [
            ["严格必要型", "维持登录、核心功能", "否"],
            ["功能型", "语言偏好、个性化设置", "是"],
            ["分析型", "匿名使用统计、优化产品", "是"],
            ["营销型（可选）", "定向广告及效果衡量", "是"],
          ],
        },
        {
          heading: "2.1 严格必要型 Cookie",
          items: [
            "此类 Cookie 对本网站的正常运行必不可少，用于维持登录会话、身份验证、安全防护（如 CSRF 防护）及核心功能。您无法关闭此类 Cookie；关闭后将导致登录及大部分功能无法正常使用。",
          ],
        },
        {
          heading: "2.2 功能型 Cookie",
          items: [
            "此类 Cookie 用于记忆您的偏好设置（如界面语言、主题）并提升使用体验。您可以关闭此类 Cookie，但关闭后您的偏好可能不会被记住。",
          ],
        },
        {
          heading: "2.3 分析型 Cookie",
          items: [
            "此类 Cookie 用于收集匿名的使用统计信息（如页面访问、功能使用情况），帮助我们了解网站运行状况并优化产品。使用的分析工具包括 Google Analytics，其隐私政策见 https://policies.google.com/privacy?hl=zh-CN。您可以关闭此类 Cookie。",
          ],
        },
        {
          heading: "2.4 营销型 Cookie（可选）",
          items: [
            "此类 Cookie 用于定向广告投放及效果衡量，仅在获得您同意后才会使用。您可以随时关闭或撤回同意。",
          ],
        },
      ],
    },
    {
      heading: "3. 第三方 Cookie 与服务提供商",
      blocks: [
        "本网站依托以下第三方服务运行，它们可能设置自己的 Cookie 或以其他方式处理数据：",
        { list: [
          "网站托管与应用服务：Vercel；",
          "数据库服务：Neon；",
          "邮件发送服务：Resend；",
          "支付处理：Waffo Pancake——支付卡数据由其独家处理，不存储于我们的服务器上；",
          "流量分析：Google Analytics；",
          "第三方登录：Google 登录服务。",
        ] },
        "上述第三方服务提供商可能位于中华人民共和国境外（如美国），数据跨境传输的安排详见《隐私政策》第 10 条。各第三方对 Cookie 及数据的处理适用其各自的隐私政策。",
      ],
    },
    {
      heading: "4. 如何管理 Cookie",
      blocks: [
        {
          heading: "4.1 浏览器设置",
          items: [
            "主流浏览器均支持管理 Cookie，您可以查看、删除或屏蔽 Cookie。常用浏览器的管理入口：",
            { list: [
              "Chrome：设置 → 隐私和安全 → 第三方 Cookie；",
              "Firefox：设置 → 隐私与安全 → Cookie 和网站数据；",
              "Safari：设置 → 隐私 → 管理网站数据；",
              "Edge：设置 → Cookie 和网站权限。",
            ] },
          ],
        },
        {
          heading: "4.2 Cookie 管理中心",
          items: [
            "您也可以通过浏览器设置或我们的 Cookie 管理中心调整 Cookie 偏好（如关闭非必要型 Cookie）。",
          ],
        },
        {
          heading: "4.3 退出分析类 Cookie",
          items: [
            "如您希望退出 Google Analytics 的数据收集，可安装 Google Analytics 官方退选浏览器插件（https://tools.google.com/dlpage/gaoptout）。",
          ],
        },
        {
          heading: "4.4 撤回同意",
          items: [
            "对于基于您的同意而设置的 Cookie（如营销型），您可随时撤回同意。撤回同意不影响撤回前基于同意进行的处理的合法性。",
          ],
        },
      ],
    },
    {
      heading: "5. 禁用 Cookie 的影响",
      blocks: [
        { list: [
          "严格必要型 Cookie 无法禁用；",
          "禁用功能型 Cookie 后，您的语言、主题等偏好可能不被记住，需要在每次访问时重新设置；",
          "禁用分析型 Cookie 后，我们仍会为您提供服务，但可能无法继续改进产品体验；",
          "禁用营销型 Cookie 不影响服务的任何功能。",
        ] },
      ],
    },
    {
      heading: "6. 本政策的更新",
      blocks: [
        "我们可能不时更新本政策。构成重大不利变更的，将在生效日前至少 14 天通过邮件或站内通知告知您；您在生效日前未提出异议且继续使用服务的，视为接受；非实质性变更即时生效并在网站公示版本历史。建议您定期查阅本政策以了解最新版本。",
      ],
    },
    {
      heading: "7. 联系方式与语言文本",
      blocks: [
        "如对本政策或我们的 Cookie 使用有任何问题，请联系：huiting.chen@outlook.com。",
        "本政策以中文及英文两种文本提供。两种文本如有歧义，以英文文本为准。",
        "最后更新：2026-8-27 · Chen Huiting · dolphinquiz.com",
      ],
    },
  ],
};
