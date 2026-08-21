# DolphinQuiz

DolphinQuiz 是一款面向教育试听课营销的 SaaS 平台，基于 Next.js 16 App Router、TypeScript、PostgreSQL、Tailwind CSS 构建。

时间：2026-8-14
开发者：DolphinQuiz 团队

## 技术栈

- **框架**: Next.js 16.2.2 (App Router, Turbopack)
- **语言**: TypeScript
- **数据库**: PostgreSQL + Drizzle ORM
- **认证**: Better Auth
- **样式**: Tailwind CSS + shadcn/ui
- **国际化**: next-intl (中/英)
- **邮件**: Resend
- **人机验证**: Cloudflare Turnstile
- **测试**: Vitest
- **构建**: pnpm + Turbopack

---

## 项目结构

```
DolphinQuiz Web/
├── app/                          # Next.js App Router 路由层
│   ├── [locale]/                 # 按语言前缀路由 (zh/en)
│   │   ├── (admin)/              # 管理员专区路由
│   │   │   ├── admin/users/      # 用户管理页面
│   │   │   └── page.tsx          # 管理后台首页
│   │   ├── (auth)/               # 认证相关路由
│   │   │   ├── login/            # 登录页
│   │   │   ├── signup/           # 注册页
│   │   │   ├── forgot-password/  # 忘记密码页
│   │   │   ├── reset-password/   # 重置密码页
│   │   │   └── layout.tsx        # 认证布局
│   │   ├── (marketing)/          # 营销页面路由
│   │   │   ├── blog/             # 博客列表与详情
│   │   │   ├── contact/          # 联系我们
│   │   │   ├── pricing/          # 定价页
│   │   │   ├── docs/             # 文档
│   │   │   ├── cookies/          # Cookie政策
│   │   │   ├── privacy/          # 隐私政策
│   │   │   ├── refund/           # 退款政策
│   │   │   ├── terms/            # 服务条款
│   │   │   └── layout.tsx        # 营销页布局
│   │   ├── (protected)/          # 受保护路由(需登录)
│   │   │   ├── dashboard/        # 仪表盘首页
│   │   │   ├── profile/          # 个人资料
│   │   │   ├── settings/         # 设置
│   │   │   └── layout.tsx        # 受保护布局(含通行证Guard)
│   │   ├── quiz/                 # Quiz 问答页(注册守卫+问答流程+Summary,无导航/页脚)
│   │   ├── check-email/          # 邮箱验证提示页
│   │   ├── verify-email/         # 邮箱验证结果页
│   │   ├── docs/                 # 文档路由
│   │   ├── layout.tsx            # 根布局
│   │   └── not-found.tsx         # 404页面
│   ├── api/                      # API 路由
│   │   ├── auth/                 # 认证相关API
│   │   │   ├── [...all]/         # Better Auth 全量路由
│   │   │   ├── signup-enhanced/  # 增强注册(加密phone+通行证)
│   │   │   ├── verify-passport/  # 校验通行证状态
│   │   │   ├── refresh-passport/ # 刷新通行证(Turnstile)
│   │   │   ├── resend-verification/ # 重发验证邮件
│   │   │   ├── verify-email/     # 邮箱验证
│   │   │   ├── forgot-password/  # 忘记密码
│   │   │   ├── reset-password/   # 重置密码
│   │   │   └── verify-reset-token/ # 验证重置令牌
│   │   ├── newsletter/           # 订阅相关API
│   │   ├── quiz/                 # Quiz 模块API
│   │   │   ├── submit/           # 询盘提交(生成编号+入库+发邮件)
│   │   │   ├── confirm/          # 销售经理确认回复(GET/POST)
│   │   │   └── limit/            # 询盘次数限制状态(AC-06)
│   │   ├── dashboard/            # Dashboard 控制台API(Phase 3~5)
│   │   │   ├── template/         # 模板+项目+限制数据(GET)
│   │   │   ├── template/save/    # 模板编辑批量保存
│   │   │   ├── email-templates/  # 邮件模板管理(GET/PUT)
│   │   │   ├── team/             # 销售经理增删(GET/POST/DELETE)
│   │   │   │   ├── phone/        # 团队电话更新(Phase 3验收修订)
│   │   │   │   └── themes/       # 团队主题更新(Phase 3验收修订)
│   │   │   ├── theme-assignments/ # 主题-经理关联(GET/PUT)
│   │   │   ├── warning-settings/ # 预警阈值设置(GET/PUT)
│   │   │   ├── export/           # Excel 导出(Phase 4,AC-11)
│   │   │   ├── backup/           # 备份触发(Phase 4,AC-12)
│   │   │   ├── audit-logs/       # 审计日志查询(Phase 4,AC-13)
│   │   │   ├── refresh-duration/ # 刷新持续时间(Phase 4收尾)
│   │   │   ├── director/         # 销售总监设置(Phase 3验收修订)
│   │   │   ├── link-check/       # 链接生成检查(Phase 3验收修订)
│   │   │   └── analysis/         # 分析图表数据(Phase 5,AC-15)
│   │   ├── projects/             # 项目API
│   │   │   └── [id]/             # 按项目ID
│   │   │       ├── route.ts      # 项目更新(PATCH 金额/备注)
│   │   │       └── status/       # 状态流转(跟进→获单/失单)
│   │   ├── admin/                # 管理员API
│   │   │   └── users/            # 用户管理(GET/PATCH)
│   │   ├── cron/warnings/        # 预警定时任务(Vercel Cron)
│   │   ├── auth/phone-status/    # 查询用户手机号状态(Quiz守卫用)
│   │   ├── auth/supplement-phone/ # Google用户补充手机号
│   │   └── user/                 # 用户API
│   │       ├── admin-status/     # 管理员状态查询
│   │       └── profile/          # 用户资料
│   ├── globals.css               # 全局样式
│   └── sitemap.ts                # 站点地图
│
├── components/                   # 通用组件
│   ├── skeletons/                # 骨架屏组件
│   ├── ui/                       # 通用UI组件(表单、按钮等)
│   ├── Logo.tsx                  # 品牌Logo
│   ├── background.tsx            # 背景装饰
│   ├── blog-card.tsx             # 博客卡片
│   ├── blog-layout.tsx           # 博客详情布局
│   ├── blur-image.tsx            # 模糊图像
│   ├── companies.tsx             # 合作公司Logo
│   ├── container.tsx             # 容器组件
│   ├── cta.tsx                   # 行动号召组件
│   ├── features.tsx              # 功能特性展示
│   ├── footer.tsx                # 页脚
│   ├── heading.tsx               # 标题组件
│   ├── hero.tsx                  # 首页Hero区
│   ├── newsletter-form.tsx       # 订阅表单
│   ├── pricing.tsx               # 定价组件
│   ├── testimonials.tsx          # 用户评价
│   └── ...                       # 其他通用组件
│
├── context/                      # React Context 提供者
│   └── theme-provider.tsx        # 主题提供者
│
├── constants/                    # 常量定义
│   └── website.ts                # 站点配置常量
│
├── content/                      # 静态内容(MDX文档)
│   └── docs/                     # 文档站点内容
│       ├── admin/                # 管理员文档
│       ├── auth/                 # 认证文档
│       ├── email/                # 邮件文档
│       ├── customization.mdx     # 自定义指南
│       ├── deployment.mdx        # 部署指南
│       ├── environment.mdx      # 环境说明
│       ├── project-structure.mdx # 项目结构文档
│       ├── quickstart.mdx       # 快速开始
│       └── troubleshooting.mdx   # 问题排查
│
├── docs/                         # 项目文档
│   ├── spec/                     # 项目需求规格
│   │   └── project-spec.md      # 项目规格说明书
│   └── superpowers/              # 开发计划与进度
│       └── plans/                # 各阶段实施计划
│
├── drizzle/                      # 数据库迁移
│   ├── meta/                     # 迁移元数据
│   ├── 0000_*.sql ~ 0009_*.sql   # 基础+Phase1 迁移SQL
│   ├── 0010_add_quiz_tables.sql  # Phase2 Quiz 决策树表迁移
│   ├── 0011_violet_thor_girl.sql # Phase2 projects 业务数据表迁移
│   ├── 0012_*.sql                # Phase3 email_templates/warning_settings 表迁移
│   ├── 0013_*.sql                # Phase3 projects 预警时间列迁移
│   ├── 0014_add_user_is_director.sql # Phase3 验收修订:user 表新增 is_director 布尔标记
│   ├── 0015_add_audit_logs.sql   # Phase4 审计日志表迁移
│   └── 0016_add_user_plan.sql    # Phase5 user 表新增 plan 套餐字段
│
├── emails/                       # 邮件模板
│   ├── verification-email.tsx   # 邮箱验证邮件
│   ├── reset-password-email.tsx  # 重置密码邮件
│   └── inquiry-notification-email.tsx # 询盘通知邮件(Internal Email)
│
├── features/                     # 业务功能模块(按领域划分)
│   ├── admin/                    # 管理员功能
│   │   ├── actions/              # 服务端操作
│   │   └── components/           # 管理员组件
│   ├── auth/                     # 认证功能
│   │   ├── components/           # 认证组件(登录/注册/Turnstile/通行证Guard)
│   │   └── schemas.ts            # 认证表单校验
│   ├── forms/                    # 通用表单
│   │   └── components/           # 表单组件
│   ├── quiz/                     # Quiz 功能模块(Phase 2)
│   │   └── components/           # Quiz 组件(问答/Summary/注册守卫/提交结果等)
│   ├── dashboard/                # Dashboard 功能模块(Phase 3~5)
│   │   ├── components/           # 控制台多Tab组件(项目看板/交互/逻辑/报告/团队/邮件/数据库/分析)
│   │   │   ├── dashboard-shell.tsx      # 控制台外壳(9 Tab)
│   │   │   ├── interaction-view.tsx     # 项目看板
│   │   │   ├── interaction-editor-view.tsx # 交互界面(问卷编辑器)
│   │   │   ├── logic-view.tsx           # 逻辑界面(节点图)
│   │   │   ├── report-templates-view.tsx # 报告模板编辑
│   │   │   ├── team-view.tsx            # 团队界面
│   │   │   ├── warning-settings-view.tsx # 邮件设置
│   │   │   ├── link-gen-view.tsx        # 链接生成
│   │   │   ├── database-view.tsx        # 数据库模块(Phase 4)
│   │   │   └── analysis-view.tsx        # 数据分析模块(Phase 5)
│   │   └── types.ts              # Dashboard 共享类型(项目/模板/限制状态等)
│   ├── marketing/                # 营销页面功能
│   │   ├── components/           # 联系表单等
│   │   └── schemas.ts            # 营销表单校验
│   └── navigation/               # 导航功能
│       ├── components/           # 导航栏/用户菜单
│       ├── config.ts             # 导航配置
│       └── types.ts              # 导航类型
│
├── layouts/                      # 页面布局
│   └── auth-layout.tsx           # 认证页面布局
│
├── lib/                          # 核心库层(业务逻辑)
│   ├── auth/                     # 认证核心
│   │   ├── admin.ts              # 管理员操作
│   │   ├── google-auth.ts       # Google OAuth配置
│   │   └── session.ts            # 会话管理
│   ├── db/                       # 数据库层
│   │   ├── index.ts              # 数据库连接
│   │   └── schema.ts             # 数据表结构定义
│   ├── quiz/                     # Quiz 业务逻辑(Phase 2)
│   │   ├── transform.ts          # Quiz 模板数据结构转换
│   │   ├── queries.ts            # Quiz 模板/节点/选项查询
│   │   ├── template-init.ts      # 默认21节点Quiz模板初始化
│   │   ├── project-number.ts     # 项目编号生成(客户名-日期-时间)
│   │   ├── internal-email.ts     # Internal Email 内容生成
│   │   ├── email-sender.ts       # 询盘邮件发送(Resend)
│   │   └── submit.ts             # 询盘提交编排(编号+入库+发信)
│   ├── dashboard/                # Dashboard 业务逻辑(Phase 3~5)
│   │   ├── project-status.ts     # 项目查询/状态流转(跟进→获单/失单)
│   │   ├── warning.ts            # 预警级别计算/邮件触发(AC-05)
│   │   ├── warning-settings.ts   # 预警阈值设置(黄/红)
│   │   ├── email-templates.ts    # 邮件模板管理+默认模板兜底
│   │   ├── inquiry-limit.ts      # 询盘次数限制(AC-06)
│   │   ├── confirm-reply.ts      # 销售经理确认回复(AC-07)
│   │   ├── team.ts               # 销售经理/主题关联管理
│   │   ├── quiz-editor.ts        # Quiz 模板可编辑数据+批量保存
│   │   ├── link-check.ts         # 链接生成前检查(Phase 3)
│   │   ├── audit-log.ts          # 审计日志(Phase 4,AC-13)
│   │   └── analysis.ts           # 分析图表聚合(Phase 5,AC-10)
│   ├── phone.ts                  # 手机号格式校验(共享)
│   ├── auth.ts                   # Better Auth配置
│   ├── auth-client.ts            # 客户端认证
│   ├── crypto.ts                 # AES-256-GCM加密工具
│   ├── passport.ts               # 通行证机制(24h有效期)
│   ├── rbac.ts                   # RBAC角色权限控制
│   ├── tenant.ts                 # 多租户上下文
│   ├── timezone.ts               # 时区处理工具
│   ├── turnstile.ts              # Cloudflare Turnstile验证
│   ├── email.ts                  # 邮件发送工具
│   ├── blog.ts                   # 博客数据获取
│   ├── metadata.ts               # SEO元数据
│   ├── i18n.ts                   # 国际化工具
│   └── ...                       # 其他工具库
│
├── messages/                     # 国际化翻译文件
│   ├── zh.json                   # 中文翻译
│   ├── en.json                   # 英文翻译
│   ├── seo.zh.json               # SEO中文翻译
│   └── seo.en.json               # SEO英文翻译
│
├── public/                       # 静态资源
│   ├── logos/                    # 合作伙伴Logo
│   ├── starter/                  # 示例图片/视频
│   ├── avatar.jpeg               # 默认头像
│   └── robots.txt                # 爬虫规则
│
├── scripts/                      # 构建/开发/数据迁移脚本
│   ├── generate-blog-manifest.mjs # 生成博客清单
│   ├── run-dev.mjs               # 开发辅助
│   ├── run-dev-utils.mjs         # 开发工具函数
│   ├── setup-admin.ts            # 设置管理员
│   ├── setup-test-data.ts        # 设置测试数据
│   ├── setup-test-manager.mjs    # 设置测试经理
│   ├── check-dates.ts            # 日期检查
│   ├── check-htm-dates.ts        # 检查HTM导入日期
│   ├── check-status.ts           # 状态检查
│   ├── find-garbled.ts           # 查找乱码
│   ├── fix-garbled.ts            # 修复乱码
│   ├── import-from-htm.ts        # 从HTM导入数据
│   ├── import-from-mht.ts        # 从MHT导入数据
│   ├── migrate-p4.ts             # Phase4数据迁移
│   ├── verify-htm-data.ts        # 验证HTM数据
│   └── sync-fumadocs-style.mjs   # 同步文档样式
│
├── src/                          # 源码(分析/追踪)
│   └── analytics/                # 分析脚本
│
├── tests/                        # 测试文件
│   ├── components/               # 组件测试
│   │   ├── quiz-flow.test.tsx     # Quiz 流程组件测试(Phase 2)
│   │   ├── auth-forms.test.tsx    # 认证表单测试
│   │   ├── admin-users-table.test.tsx # 管理员用户表测试
│   │   ├── button.test.tsx        # 按钮组件测试
│   │   ├── hero.test.tsx          # Hero 组件测试
│   │   ├── locale-link.test.tsx   # 语言链接测试
│   │   ├── pricing-marketing.test.tsx # 定价页面测试
│   │   └── settings-page.test.tsx # 设置页面测试
│   ├── lib/                      # 库层测试
│   │   ├── db/schema.test.ts     # Schema测试
│   │   ├── crypto.test.ts        # 加密工具测试
│   │   ├── passport.test.ts      # 通行证测试
│   │   ├── rbac.test.ts          # RBAC测试
│   │   ├── tenant.test.ts        # 多租户测试
│   │   ├── timezone.test.ts      # 时区测试
│   │   ├── turnstile.test.ts     # Turnstile测试
│   │   ├── quiz/                 # Quiz 模块测试(Phase 2)
│   │   │   ├── transform.test.ts      # 模板结构转换测试
│   │   │   ├── template-init.test.ts  # 默认模板初始化测试
│   │   │   ├── project-number.test.ts # 项目编号生成测试
│   │   │   ├── internal-email.test.ts # 邮件内容生成测试
│   │   │   ├── email-sender.test.ts   # 邮件发送器测试
│   │   │   ├── submit.test.ts         # 询盘提交编排测试
│   │   │   └── projects-schema.test.ts # projects 表 schema 测试
│   │   └── dashboard/            # Dashboard 模块测试(Phase 3~5)
│   │       ├── warning.test.ts         # 预警逻辑测试(16用例)
│   │       ├── project-status.test.ts  # 状态流转测试(12用例)
│   │       ├── inquiry-limit.test.ts   # 询盘限制测试(8用例)
│   │       ├── email-templates.test.ts # 邮件模板测试(6用例)
│   │       ├── dashboard-schema.test.ts # Phase3 schema 测试
│   │       ├── audit-log.test.ts       # 审计日志测试(Phase 4,4用例)
│   │       └── analysis.test.ts        # 分析图表测试(Phase 5,34用例)
│   └── ...                       # 其他测试
│
├── DolphinQuiz.design/           # 设计稿
├── 项目需求文档/                   # 需求文档
├── 项目验收/                       # 验收文档
│
├── AGENTS.md                     # AI智能体项目规则
├── package.json                  # 项目依赖配置
├── next.config.mjs               # Next.js配置
├── tailwind.config.ts            # Tailwind配置
├── drizzle.config.ts             # Drizzle配置
├── i18n.config.ts                # 国际化配置
├── vitest.config.ts              # 测试配置
├── eslint.config.mjs             # ESLint配置
├── tsconfig.json                 # TypeScript配置
├── .env.example                  # 环境变量示例
└── README.md                     # 本文件
```

---

## Phase 1 多租户认证与用户管理 — 涉及文件清单

### 新增文件

| 文件路径 | 说明 |
|---------|------|
| `lib/crypto.ts` | **AES-256-GCM 加密工具**。提供 encrypt/decrypt 函数，用于敏感字段（如手机号）加密存储。密钥通过 SHA-256 派生，密文格式为 `iv:authTag:encrypted`（base64）。 |
| `lib/passport.ts` | **通行证机制**。实现 issuePassport/verifyPassport/revokePassport，24 小时有效期，存储于 user 表 passport 相关字段。 |
| `lib/rbac.ts` | **RBAC 角色权限控制**。支持 admin/sales_director/sales_manager/user 四种角色，提供 requireRole/requireAdmin/requireDashboardAccess 等守卫函数。 |
| `lib/tenant.ts` | **多租户上下文管理**。提供 getCurrentTenantId/assertTenantOwnership，实现行级租户隔离（tenant_id = user.id）。 |
| `lib/timezone.ts` | **时区处理工具**。UTC 存储与用户时区转换，提供 toUserTimezone/formatInTimezone/guessRegionFromTimezone。 |
| `lib/turnstile.ts` | **Cloudflare Turnstile 服务端验证**。验证人机验证 token，未配置密钥时开发环境放行。 |
| `features/auth/components/turnstile.tsx` | **Turnstile 客户端组件**。动态加载 Turnstile 脚本，渲染人机验证 widget，处理验证回调。 |
| `features/auth/components/passport-guard.tsx` | **通行证 Guard 组件**。客户端校验通行证状态，无效时显示 Turnstile 重新验证界面。 |
| `app/api/auth/signup-enhanced/route.ts` | **增强注册端点**。在 Better Auth 注册成功后，加密 phone + 验证 Turnstile + 发放通行证。 |
| `app/api/auth/verify-passport/route.ts` | **校验通行证端点**。GET 请求返回当前用户通行证状态（valid/reason/expiresAt）。 |
| `app/api/auth/refresh-passport/route.ts` | **刷新通行证端点**。POST 请求，验证 Turnstile 后重新发放 24h 通行证。 |
| `drizzle/0009_add_user_phone_passport_timezone.sql` | **数据库迁移文件**。为 user 表添加 phone/passport_status/passport_verified_at/passport_expires_at/timezone 五个字段。 |

### 修改文件

| 文件路径 | 修改说明 |
|---------|---------|
| `lib/db/schema.ts` | user 表新增 phone、passportStatus、passportVerifiedAt、passportExpiresAt、timezone 字段；定义 USER_ROLES 和 PASSPORT_STATUS 常量。 |
| `features/auth/schemas.ts` | signupSchema 新增 phone（正则校验 `/^1[3-9]\d{9}$/`）和 turnstileToken 必填校验。 |
| `features/auth/components/signup-form.tsx` | 注册表单新增手机号输入框 + TurnstileWidget 组件；注册成功后调用 signup-enhanced 端点；修复 shouldValidate 导致的 ZodError。 |
| `features/auth/components/index.ts` | 导出新增的 PassportGuard 组件。 |
| `features/navigation/components/user-menu.tsx` | 使用 navigation.main.credits 翻译 key（已修复缺失）。 |
| `app/[locale]/(protected)/layout.tsx` | 在受保护布局中添加 PassportGuard 包裹 children。 |
| `messages/zh.json` | 添加 `navigation.main.credits` 翻译："积分"。 |
| `messages/en.json` | 添加 `navigation.main.credits` 翻译："Credits"。 |
| `lib/metadata.ts` | siteName 改为 DolphinQuiz。 |
| `lib/email.ts` | 所有邮件模板中的品牌名改为 DolphinQuiz。 |
| `emails/verification-email.tsx` | 验证邮件品牌名改为 DolphinQuiz。 |
| `emails/reset-password-email.tsx` | 重置密码邮件品牌名改为 DolphinQuiz。 |
| `components/blog-card.tsx` | 移除 Balancer 组件（修复 Next.js 16 script tag 错误）。 |
| `package.json` | 项目名改为 DolphinQuiz。 |
| `LICENSE` | 版权改为 DolphinQuiz。 |
| `public/robots.txt` | 站点名改为 DolphinQuiz。 |
| `components/cta.tsx` | 外部链接改为 DolphinQuiz。 |
| `features/marketing/components/contact-form.tsx` | GitHub 链接改为 DolphinQuiz 仓库。 |

### Phase 1 测试文件

| 文件路径 | 说明 |
|---------|------|
| `tests/lib/crypto.test.ts` | 加密工具测试（6 用例：加密/解密/密钥检查） |
| `tests/lib/passport.test.ts` | 通行证测试（4 用例：验证状态/过期/未找到） |
| `tests/lib/rbac.test.ts` | RBAC 权限测试（6 用例：角色检查/守卫） |
| `tests/lib/tenant.test.ts` | 多租户测试（6 用例：租户 ID/归属校验） |
| `tests/lib/timezone.test.ts` | 时区转换测试（7 用例：UTC 转换/格式化/地区推断） |
| `tests/lib/turnstile.test.ts` | Turnstile 测试（5 用例：验证成功/失败/空 token） |
| `tests/lib/db/schema.test.ts` | Schema 测试（8 用例：新增字段/常量验证） |

---

## Phase 2 Quiz 决策树模块 — 涉及文件清单

### 新增文件

| 文件路径 | 说明 |
|---------|------|
| `lib/quiz/transform.ts` | **Quiz 共享类型与结构转换**。定义 QuizClientTemplate/QuizResult/QuizPathEntry 等类型；buildClientTemplate 将 DB 记录（模板/节点/边）组装为客户端模板结构。 |
| `lib/quiz/queries.ts` | **Quiz 数据查询**。getActiveClientTemplate/getFirstActiveClientTemplate 查询激活模板及全部节点与选项。 |
| `lib/quiz/template-init.ts` | **默认 Quiz 模板初始化**。构建 21 节点决策树（1 个 P1 + 4 个 P2 + 16 个 P3）+ 84 条选项边（64 种最终选择），createDefaultQuizTemplate 事务写入 DB。 |
| `lib/quiz/project-number.ts` | **项目编号生成**。格式：客户名-YYYY-MM-DD-HHmmss（UTC），sanitizeCustomerName 清洗客户名，appendRetrySuffix 处理唯一冲突。 |
| `lib/quiz/internal-email.ts` | **Internal Email 内容生成**。buildInquiryEmailContent 构建客户信息/项目编号/主题/Quiz 路径摘要等邮件内容数据。 |
| `lib/quiz/email-sender.ts` | **询盘通知邮件发送器**。generateConfirmUrl 生成经理确认回复链接，sendInquiryNotificationEmail 通过 Resend 发送（发经理、抄送总监）。 |
| `lib/quiz/submit.ts` | **询盘提交编排**。生成项目编号 → 写入 projects 表（唯一冲突重试）→ 解析收件人（经理/总监/测试回退邮箱）→ 发送邮件。 |
| `lib/phone.ts` | **手机号校验工具**。PHONE_PATTERN 正则 + isValidPhone，注册/手机号补充共用。 |
| `emails/inquiry-notification-email.tsx` | **询盘通知邮件模板（React Email）**。展示客户信息、项目编号、询盘时间、Quiz 路径、销售经理确认按钮。 |
| `app/api/quiz/submit/route.ts` | **询盘提交 API**。校验登录 → 校验请求体 → 解密手机号 → 解析经理/总监 → 提交询盘（编号+入库+发邮件）。 |
| `app/api/auth/supplement-phone/route.ts` | **补充手机号 API**。Google 登录用户补充手机号（非强制），校验格式后加密存储。 |
| `app/api/auth/phone-status/route.ts` | **手机号状态查询 API**。基于 DB 判断用户是否已填手机号（session 不含 phone 字段）。 |
| `features/quiz/components/quiz-flow.tsx` | **Quiz 问答流程组件**。P1→P2→P3→P4 流转、图形进度条（首页样品样式）、选项高亮+继续按钮、P4 结果层展示 Summary 摘要（报告模板渲染）。 |
| `features/quiz/components/quiz-flow-container.tsx` | **Quiz 流程容器**。管理问答/P4 Summary/提交三个阶段，P4 页点击"返回开始"调用提交 API。 |
| `features/quiz/components/quiz-submit-view.tsx` | **询盘提交结果视图**。展示项目编号与邮件发送状态，"返回开始"重新开始。 |
| `features/quiz/components/quiz-register-guard.tsx` | **Quiz 前置注册守卫**。未登录→注册卡片；已登录无手机号→补充卡片；已有手机号→直接进入答题。 |
| `features/quiz/components/quiz-register-card.tsx` | **Quiz 前置注册卡片**。手机+邮箱+人机验证注册，成功后进入 Quiz。 |
| `features/quiz/components/quiz-phone-supplement-card.tsx` | **手机号补充卡片（非强制）**。Google 用户进入 Quiz 前可补充或跳过。 |
| `drizzle/0010_add_quiz_tables.sql` | **Quiz 决策树表迁移**。创建 quiz_templates/quiz_nodes/quiz_edges 三表。 |
| `drizzle/0011_violet_thor_girl.sql` | **projects 业务数据表迁移**。创建 24 列项目跟踪表（基于附件1），project_number 唯一。 |

### 修改文件

| 文件路径 | 修改说明 |
|---------|---------|
| `lib/db/schema.ts` | 新增 Quiz 三表（quiz_templates/quiz_nodes/quiz_edges）与 projects 业务数据表（24 列 + 租户隔离）。 |
| `app/[locale]/quiz/page.tsx` | Quiz 页面：加载激活模板，QuizRegisterGuard 包裹 QuizFlowContainer（独立布局,无导航/页脚）。 |
| `features/auth/schemas.ts` | 手机号正则改用共享 PHONE_PATTERN。 |
| `features/quiz/components/quiz-flow-container.tsx` | "返回开始"从空实现改为调用 /api/quiz/submit（生成编号+入库+发邮件）。 |
| `.env.local` / `.env.example` | 新增 RESEND_INTERNAL_TEST_EMAIL（测试期回退邮箱）。 |

### Phase 2 测试文件

| 文件路径 | 说明 |
|---------|------|
| `tests/lib/quiz/transform.test.ts` | 模板结构转换测试（13 用例） |
| `tests/lib/quiz/template-init.test.ts` | 默认模板初始化测试（35 用例：21节点/84选项/64路径） |
| `tests/lib/quiz/project-number.test.ts` | 项目编号生成测试（14 用例：格式/UTC/唯一性） |
| `tests/lib/quiz/internal-email.test.ts` | 邮件内容生成测试（16 用例） |
| `tests/lib/quiz/email-sender.test.ts` | 邮件发送器测试（7 用例：负载/回退/发送） |
| `tests/lib/quiz/submit.test.ts` | 询盘提交编排测试（16 用例：编号重试/收件人/发信） |
| `tests/lib/quiz/projects-schema.test.ts` | projects 表 schema 测试（5 用例：24列/唯一约束） |
| `tests/components/quiz-flow.test.tsx` | Quiz 问答流程组件测试（9 用例：选项高亮/继续按钮/P4 Summary） |

---

## Phase 3 Dashboard 控制台 — 涉及文件清单

### 新增文件

| 文件路径 | 说明 |
|---------|------|
| `features/dashboard/types.ts` | **Dashboard 共享类型**。DashboardTemplate/EditableNode/DashboardProject/InquiryLimitStatus/WarningSettings/SalesManager 等。 |
| `features/dashboard/components/dashboard-shell.tsx` | **控制台外壳**。桌面左侧边栏 + 手机横向 Tab，9 个 Tab（项目看板/交互界面/逻辑界面/报告模板/团队界面/邮件设置/链接生成/数据库/数据分析）。 |
| `features/dashboard/components/interaction-view.tsx` | **项目看板（原交互界面更名）**。升级提示横幅（询盘限制）、今日询盘统计、项目列表（编号/客户/主题/时长/状态）、状态流转按钮。 |
| `features/dashboard/components/interaction-editor-view.tsx` | **交互界面（问卷编辑器）**。节点选择器、手机问卷效果预览、选项右侧主题词输入框、保存按钮、风格模板选择（快速预览，MVP 一套）。 |
| `features/dashboard/components/logic-view.tsx` | **逻辑界面 - 节点图 + 输入表格**。ECharts tree 渲染 85 节点决策树（P1 蓝/P2 橙/P3 绿/P4 紫），点击节点联动下方编辑表格，表格下方 P3-AC 问卷效果预览。 |
| `features/dashboard/components/report-templates-view.tsx` | **报告模板编辑**。6 组邮件模板（内部告知/Summary/黄预/红预/询盘接近上限/询盘达到上限）+ 每模板 To/CC 展示 + 可用变量 + 保存。 |
| `features/dashboard/components/team-view.tsx` | **团队界面**。销售总监设置、销售经理添加/移除、经理负责主题多选+保存。 |
| `features/dashboard/components/warning-settings-view.tsx` | **邮件设置**。黄色（默认24h）/红色（默认48h）预警阈值设置 + 预警规则说明。 |
| `features/dashboard/components/link-gen-view.tsx` | **链接生成**。两步操作：检查问卷信息齐备性（问题/选项/主题词/经理关联）+ 生成 Quiz 问卷链接（复制）。 |
| `features/dashboard/components/database-view.tsx` | **数据库模块**。三 Tab 界面：项目数据表格（搜索/筛选/导出）、审计日志（最近50条）、备份管理（触发+说明）。 |
| `features/dashboard/components/analysis-view.tsx` | **数据分析模块**。10 个 ECharts 柱状图卡片，免费用户仅图表1可见，Pro/Max 用户全部可见。 |
| `features/admin/internal-admin-view.tsx` | **内部管理视图**。用户角色（RBAC）权限分配、询盘上限提醒模板编辑、模板位置说明（仅 admin 可访问）。 |
| `lib/dashboard/link-check.ts` | **链接生成前检查**。检查模板信息齐备性（占位符/选项/主题词/销售经理），返回缺失项清单。 |
| `lib/dashboard/project-status.ts` | **项目查询与状态流转**。STATUS_TRANSITIONS（跟进→获单/失单、失单→跟进）、canTransitionStatus、isProjectEnded、getProjectsByTenant、updateProjectStatus。 |
| `lib/dashboard/warning.ts` | **预警逻辑（AC-05）**。computeWarningLevel（先判 3 天/结束，红≥阈值优先）、computeDuration、renderTemplate（@变量替换）、processTenantWarnings（发黄/红预警邮件 + DB 登记）。 |
| `lib/dashboard/warning-settings.ts` | **预警阈值设置**。getWarningSettingsByTenant（无则插入默认）、updateWarningSettingsByTenant（校验红>黄）。 |
| `lib/dashboard/email-templates.ts` | **邮件模板管理**。getEmailTemplatesByTenant（默认兜底）、upsertEmailTemplate、7 类默认模板。 |
| `lib/dashboard/inquiry-limit.ts` | **询盘次数限制（AC-06）**。FREE_DAILY_INQUIRY_LIMIT=5、INQUIRY_NEAR_LIMIT=3、countInquiriesToday、maybeSendInquiryLimitEmails（恰好 3/5 时发提示邮件）。 |
| `lib/dashboard/confirm-reply.ts` | **销售经理确认回复（AC-07）**。getConfirmReplyData、confirmProjectReply（记录 reply_datetime/reply_date/reply_time/interval_hours）。 |
| `lib/dashboard/team.ts` | **团队管理**。listSalesManagers/addSalesManager/removeSalesManager/getThemeAssignments/updateThemeManager（改 P3 选项 result_manager_id）。 |
| `lib/dashboard/quiz-editor.ts` | **Quiz 模板编辑**。getEditableTemplate（节点+选项）、saveTemplateEdits（事务批量保存，校验归属）。 |
| `app/api/dashboard/template/route.ts` | **Dashboard 数据 API**。GET 返回模板（可编辑）+ 项目列表 + 询盘限制状态。 |
| `app/api/dashboard/template/save/route.ts` | **模板保存 API**。POST 批量保存节点与选项编辑。 |
| `app/api/dashboard/email-templates/route.ts` | **邮件模板 API**。GET 模板列表 / PUT 更新保存。 |
| `app/api/dashboard/warning-settings/route.ts` | **预警设置 API**。GET 阈值 / PUT 更新（校验红>黄）。 |
| `app/api/dashboard/team/route.ts` | **团队 API**。GET 经理列表 / POST 添加 / DELETE 移除。 |
| `app/api/dashboard/theme-assignments/route.ts` | **主题关联 API**。GET 主题-经理映射 / PUT 更新（写 P3 选项）。 |
| `app/api/projects/[id]/status/route.ts` | **状态流转 API**。PATCH 更新项目状态（获单/失单/跟进），Dashboard 权限校验。 |
| `app/api/quiz/confirm/route.ts` | **确认回复 API**。GET 确认页数据 / POST 记录回复时间。 |
| `app/api/quiz/limit/route.ts` | **询盘限制 API**。GET 今日询盘次数状态（x-tenant-id / query 参数）。 |
| `app/api/cron/warnings/route.ts` | **预警定时任务 API**。POST 遍历所有租户触发预警（CRON_SECRET 保护，开发环境放行）。 |
| `app/[locale]/quiz/confirm/page.tsx` | **经理确认回复页面**。展示项目/客户/主题/询盘时间，点击"确认已回复客户"记录时间。 |
| `vercel.json` | **Vercel Cron 配置**。每小时触发 /api/cron/warnings。 |
| `drizzle/0012_*.sql` | **Phase3 表迁移**。email_templates + warning_settings 表。 |
| `drizzle/0013_*.sql` | **Phase3 列迁移**。projects 新增 warning_yellow_at/warning_red_at。 |

### 修改文件

| 文件路径 | 修改说明 |
|---------|---------|
| `lib/db/schema.ts` | 新增 emailTemplates/warningSettings 表 + projects 预警时间列；新增 EMAIL_TEMPLATE_TYPES/PROJECT_STATUS 常量。 |
| `app/api/quiz/submit/route.ts` | Phase 3 加入询盘限制检查（isLimited 返回 403）+ 提交后调用 maybeSendInquiryLimitEmails。 |
| `app/[locale]/(protected)/dashboard/page.tsx` | 重构为 Dashboard 控制台（渲染 DashboardShell）。 |
| `lib/email.ts` | sendEmail 显式检查 Resend 返回的 error 字段，避免"发送失败"误判为成功。 |
| `tailwind.config.ts` | content 增加 ./features/**（此前 features 目录 Tailwind 类未生成）。 |

### Phase 3 测试文件

| 文件路径 | 说明 |
|---------|------|
| `tests/lib/dashboard/warning.test.ts` | 预警逻辑测试（16 用例：级别判断/3天限制/去重/模板渲染） |
| `tests/lib/dashboard/project-status.test.ts` | 状态流转测试（12 用例：合法/非法流转/结束判断） |
| `tests/lib/dashboard/inquiry-limit.test.ts` | 询盘限制测试（8 用例：计数/阈值/提示邮件触发） |
| `tests/lib/dashboard/email-templates.test.ts` | 邮件模板测试（6 用例：默认兜底/更新/非法类型） |
| `tests/lib/dashboard/dashboard-schema.test.ts` | Phase3 schema 测试（5 用例：新表/唯一约束） |

### Phase 3 验收修订(2026-8-14)

| 文件路径 | 修改说明 |
|---------|---------|
| `lib/db/schema.ts` | user 表新增 isDirector 布尔标记(验收修订 2.1.7.5,总监/经理可同一人)。 |
| `lib/auth/session.ts` | AccessUser 类型新增 isDirector 字段。 |
| `lib/rbac.ts` | requireDashboardAccess 允许 isDirector 标记用户访问。 |
| `lib/dashboard/team.ts` | 新增 isDirector 判定、电话解密、updateUserPhone 函数；getSalesDirector 统一查询入口。 |
| `lib/quiz/internal-email.ts` | renderTemplateVars 扩展为 11 个变量 + pricingUrl 计算；修复正文未做变量替换的 bug(2.1.7.4-b)。 |
| `features/dashboard/components/team-view.tsx` | 总监/经理卡片各加电话输入框+保存按钮；提示文字改为"可为同一人"(2.1.7.5)。 |
| `features/dashboard/components/report-templates-view.tsx` | 移除询盘接近上限/达到上限两项模板(2.1.9-b,移至内部管理页)。 |
| `features/admin/internal-admin-view.tsx` | 保留询盘上限提醒模板编辑；修正说明文字(2.1.9-b)。 |
| `features/dashboard/components/link-gen-view.tsx` | 链接生成添加模板 ID 参数(2.1.8-b)。 |
| `app/[locale]/quiz/page.tsx` | 支持 searchParams.t 参数加载指定模板(2.1.8-b)。 |
| `features/quiz/components/quiz-flow-container.tsx` | 询盘上限错误提示增强为醒目警示样式(橙色边框+脉冲动画+图标)。 |
| `drizzle/0014_add_user_is_director.sql` | 新增迁移:user 表添加 is_director 布尔列。 |

### Phase 3 验收修订测试文件

| 文件路径 | 说明 |
|---------|------|
| `tests/lib/quiz/internal-email.test.ts` | 新增邮件变量替换测试(20 用例,覆盖 11 个变量+HTML 转义) |

---

## Phase 4 数据库业务数据模块 — 涉及文件清单

### 新增文件

| 文件路径 | 说明 |
|---------|------|
| `lib/dashboard/audit-log.ts` | **审计日志核心函数**。logAudit 记录操作（login/logout/export/delete/update/create），getAuditLogs 分页查询，租户隔离。 |
| `app/api/dashboard/export/route.ts` | **Excel 导出 API**。使用 exceljs 生成 .xlsx 文件，导出后自动记录审计日志。列：项目编号/客户名/主题/联系电话/邮箱/询盘日期/询盘时间/项目状态/金额/持续时间/间隔时间/是否超3天/回复日期/地区/备注。 |
| `app/api/dashboard/backup/route.ts` | **备份触发 API**。POST 触发备份请求并记录审计日志，GET 返回备份状态说明（实际备份由 Neon 自动管理）。 |
| `app/api/dashboard/audit-logs/route.ts` | **审计日志查询 API**。GET 当前用户最近审计日志，支持分页（limit/offset）。 |
| `app/api/dashboard/refresh-duration/route.ts` | **刷新持续时间 API**。POST 遍历所有项目重新计算持续时间（Phase 4 收尾）。 |
| `drizzle/0015_add_audit_logs.sql` | **审计日志表迁移**。创建 audit_logs 表（id/user_id/action_type/description/details/ip_address/created_at）。 |
| `drizzle/0016_add_user_plan.sql` | **用户套餐字段迁移**。user 表新增 plan 字段（free/pro/max，默认 free）。 |
| `tests/lib/dashboard/audit-log.test.ts` | 审计日志测试（4 用例：插入/可选 IP/查询/分页） |

### 修改文件

| 文件路径 | 修改说明 |
|---------|---------|
| `lib/db/schema.ts` | 新增 audit_logs 表定义 + AUDIT_ACTION_TYPES 常量（login/logout/export/delete/update/create）。 |
| `drizzle/meta/_journal.json` | 新增 idx 15 条目 `0015_add_audit_logs`。 |
| `features/dashboard/components/database-view.tsx` | 从占位组件重写为完整三 Tab 界面：项目数据表格（搜索/筛选/导出按钮）、审计日志、备份管理。 |

---

## Phase 5 分析模块 — 涉及文件清单

### 新增文件

| 文件路径 | 说明 |
|---------|------|
| `lib/dashboard/analysis.ts` | **10 个分析图表聚合函数**。纯函数，入参 projects 数组，UTC 时间处理。函数：computeWeeklyVisits 每周分布、computeHourlyDistribution 时区分布（12段）、computeMonthlyVisits 13月分布、computeQuarterlyVisits Q1-Q4、computeYearlyVisits 每年、computeThemeDistribution 主题分布、computeThemeHourlyDistribution 主题×时区（4系列）、computeManagerStatusDistribution 经理×状态（3系列）、computeManagerThemeDistribution 经理×主题（4系列）、computeManagerAvgReplyTime 经理平均回复（小时）。 |
| `app/api/dashboard/analysis/route.ts` | **分析图表数据 API**。GET /api/dashboard/analysis?chart=1~10，套餐分级：免费用户仅 chart 1 可访问，chart 2-10 返回 403。数据获取与聚合分离（getProjectsByTenant → computeChartData）。 |
| `drizzle/0016_add_user_plan.sql` | **用户套餐字段迁移**。user 表新增 plan 字段（free/pro/max，默认 free），用于分析模块套餐分级控制。 |

### 修改文件

| 文件路径 | 修改说明 |
|---------|---------|
| `features/dashboard/types.ts` | DashboardProject 新增 managerId 和 intervalHours 字段。 |
| `features/dashboard/components/analysis-view.tsx` | 从占位组件重写为 10 个 ECharts 柱状图卡片，使用 useRef + useEffect 创建图表实例，窗口 resize 自动调整。免费用户显示套餐升级提示横幅+图表1可见+图表2-10锁定。 |

### Phase 5 测试文件

| 文件路径 | 说明 |
|---------|------|
| `tests/lib/dashboard/analysis.test.ts` | 分析图表测试（34 用例，覆盖全部 10 个聚合函数） |

---

## Phase 4 & 5 收尾修订 — 涉及文件清单

### 修改文件

| 文件路径 | 修改说明 |
|---------|---------|
| `lib/db/schema.ts` | 新增 audit_logs 表定义 + AUDIT_ACTION_TYPES 常量；user 表新增 plan 字段。 |
| `features/dashboard/components/database-view.tsx` | 从占位组件重写为完整三 Tab 界面：项目数据表格（搜索/筛选/导出/更新持续时间）、审计日志、备份管理。 |
| `features/dashboard/components/analysis-view.tsx` | 10 个 ECharts 柱状图卡片，套餐分级控制，免费用户仅图表1可见。 |
| `features/dashboard/types.ts` | DashboardProject 新增 managerId 和 intervalHours 字段（Phase 5 分析用）。 |
| `lib/dashboard/warning.ts` | computeDuration 导出为分析模块复用。 |
| `drizzle/meta/_journal.json` | 新增 idx 15（audit_logs）和 idx 16（user_plan）迁移条目。 |

---

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8
- PostgreSQL >= 14

### 安装步骤

1. **安装依赖**
```bash
pnpm install
```

2. **设置环境变量**
```bash
cp .env.example .env.local
```

编辑 `.env.local` 配置必要的环境变量（数据库连接、认证密钥等）。

3. **设置数据库**
```bash
pnpm db:push
```

4. **启动开发服务器**
```bash
pnpm dev
```

访问 http://localhost:3000 查看应用。

### 可用脚本

```bash
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器
pnpm lint             # 运行 ESLint
pnpm typecheck        # TypeScript 类型检查
pnpm test             # 运行单元测试
pnpm db:generate      # 生成 Drizzle 迁移
pnpm db:migrate       # 执行数据库迁移
pnpm db:push          # 推送 schema 到数据库
pnpm db:studio        # 打开 Drizzle Studio
```

---

## 文档

- 文档站点：`/docs`（英文）、`/zh/docs`（中文）
- [项目规格说明书](docs/spec/project-spec.md)
- [Phase 1 实施计划](docs/superpowers/plans/2026-08-10-phase1-multi-tenant-auth.md)

## 许可证

Copyright (c) 2025 DolphinQuiz
