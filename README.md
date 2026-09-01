# DolphinQuiz

## Introduction
DolphinQuiz is a SaaS platform built for educational trial-lesson marketing, powered by Next.js 16 App Router, TypeScript, PostgreSQL, and Tailwind CSS.

Date: 2026-8-14
Developer: Tim Chen and DolphinQuiz Team

Important notice: If you are using this for a commercial SaaS and do not want to make your source public, you must purchase a commercial license; otherwise, you would violate the AGPL-3.0 license.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack) · React 19 · TypeScript
- **Database**: PostgreSQL · Drizzle ORM
- **Authentication**: Better Auth (Email / Google OAuth) + Passport mechanism + RBAC
- **Styling**: Tailwind CSS · shadcn/ui
- **i18n**: next-intl (EN / ZH)
- **Email**: React Email · Resend
- **Bot Protection**: Cloudflare Turnstile
- **Data Visualization**: ECharts (decision-tree node graph / analysis charts)
- **Docs Site**: Fumadocs (MDX)
- **Testing**: Vitest
- **Others**: Waffo Pancake (payments) · exceljs (Excel export) · Vercel Cron

---

## Key Features

DolphinQuiz covers the full loop of "educational trial lessons — from lead acquisition to deal tracking":

- **Quiz decision-tree inquiry**: An 85-node decision-tree questionnaire (P1→P2→P3→P4). After answering, a project number is auto-generated, the inquiry is stored, and a notification email is sent to the sales manager.
- **Dashboard console**: 9 functional tabs for one-stop marketing process management.
- **Project board**: Today's inquiry stats, project list, and status transitions (Follow-up → Won / Lost).
- **Interaction / Logic editor**: Questionnaire editor + ECharts decision-tree node graph for visually configuring templates and option themes.
- **Report templates**: 6 email template categories (Internal Notice / Summary / Yellow Alert / Red Alert / Inquiry Limit) with variable rendering and To/CC configuration.
- **Team management**: Sales director / sales manager setup, with manager-to-theme binding.
- **Link generation**: Validates questionnaire completeness, then produces a copyable standalone quiz link.
- **Email alerts**: Yellow / red alert thresholds auto-detected; overdue projects trigger alert emails (Vercel Cron hourly scan).
- **Database module**: Project search / filter / Excel export, audit logs, and backup management.
- **Data analysis**: 10 visual charts (weekly / hourly / monthly / quarterly / yearly trends, theme distribution, multi-dimensional manager stats).
- **Multi-tenancy & permissions**: Row-level isolation per tenant, supporting four roles: `user / sales_manager / sales_director / admin`.
- **Plan tiers**: free / pro / max, controlling quotas (quiz count, inquiry volume, team member count, chart visibility).

---

## Directory Structure

```
app/          Next.js routing layer ([locale]/ + api/)
components/   Shared components
features/     Business modules: auth · quiz · dashboard · admin · marketing
lib/          Core layer: auth · db · quiz · dashboard · rbac · tenant
content/docs/ MDX content for the docs site
drizzle/      Database migrations (0000 ~ 0019)
emails/       React Email templates
messages/     i18n translations (zh / en)
tests/        Vitest unit tests (components / lib)
scripts/      Build, data, and style-sync scripts
```

---

## Getting Started

**Requirements**: Node.js ≥ 20 · pnpm ≥ 10 · PostgreSQL ≥ 14

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment variables
cp .env.example .env.local
# Edit .env.local: DATABASE_URL, BETTER_AUTH_*, RESEND_*, TURNSTILE_* etc.

# 3. Initialize the database
pnpm db:migrate

# 4. Set up the super admin (the account matching SUPER_ADMIN_EMAIL)
pnpm admin:setup

# 5. Start the development server
pnpm dev
```

Visit http://localhost:3000.

> Note: `predev` / `prebuild` automatically sync the Fumadocs styles (`sync:fumadocs-style`); no manual step is required.

---

## Script Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the development server |
| `pnpm build` | Build the production bundle |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest unit tests |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:push` | Push the schema to the database |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm admin:setup` | Set up the super admin |
| `pnpm sync:fumadocs-style` | Sync the docs site styles |

---

## Testing

```bash
pnpm test        # Full unit test suite
pnpm test:watch  # Watch mode
pnpm test:coverage
```

Tests cover authentication, RBAC, multi-tenancy, the Quiz decision tree, project status transitions, alert logic, audit logs, and the 10 analysis aggregation functions.

---

## Documentation

- Docs site: `/docs` (English), `/zh/docs` (Chinese)
- [Project Specification](docs/spec/project-spec.md): requirements, acceptance criteria, and file lists for each phase

---

## License

AGPL-3.0 · Copyright (c) 2026 DolphinQuiz