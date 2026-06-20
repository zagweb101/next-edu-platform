# Next.js Production Boilerplate

> A complete, production-ready Next.js 16 boilerplate with everything you need to ship SaaS apps fast.
> Auth, payments, notifications, dashboards, i18n, and CI/CD — all wired up.

## 🚀 Features

- **Authentication** — NextAuth v5 with Credentials, Google, GitHub, and Role-Based Access Control (RBAC)
- **Payments** — Moyasar integration (mada, Apple Pay, STC Pay, Visa, Mastercard) with webhooks & refunds
- **Notifications** — Three channels via BullMQ queues:
  - In-app (notification center + bell dropdown)
  - Email (Resend + React Email templates, RTL-aware)
  - Push (Firebase Cloud Messaging for web/mobile)
- **Dashboard** — Admin + Analytics with KPIs, charts, user management, payments, audit log
- **i18n** — Arabic + English with automatic RTL/LTR via `next-intl`
- **Database** — Prisma ORM with SQLite (local dev) / PostgreSQL (production)
- **File Uploads** — UploadThing for images, PDFs, Office docs
- **Background Jobs** — BullMQ + Redis for email/push queues
- **Logging** — Pino structured logging with request-scoped context
- **Error Tracking** — Sentry integration (server + client)
- **Audit Log** — Every sensitive action is recorded
- **Testing** — Vitest (unit) + Playwright (E2E)
- **Deployment** — Railway-ready with PR previews, Dockerfile, GitHub Actions CI/CD

## 📦 Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | Prisma 6 + PostgreSQL/SQLite |
| Auth | NextAuth.js v5 (Auth.js) |
| i18n | next-intl 4 |
| Payments | Moyasar SDK |
| Email | Resend + React Email |
| Push | Firebase Admin (FCM) |
| Queue | BullMQ + ioredis |
| Logging | Pino + pino-pretty |
| Monitoring | Sentry |
| File Upload | UploadThing |
| State | TanStack Query + Zustand |
| Testing | Vitest + Playwright |
| Package Manager | Bun |
| Deployment | Railway |

## 🏁 Quick Start

### Prerequisites
- [Bun](https://bun.sh) 1.3+
- Node.js 20+ (for some tooling)
- (Optional) Docker & Docker Compose for local Postgres + Redis

### Installation

```bash
# 1. Clone the repo (or use as a template)
git clone <your-repo-url> my-app
cd my-app

# 2. Install dependencies
bun install

# 3. Copy environment template
cp .env.example .env

# 4. Generate AUTH_SECRET
openssl rand -base64 32
# Paste the output into .env as AUTH_SECRET

# 5. Push database schema
bun run db:push

# 6. (Optional) Seed demo data + admin user
bun run db:seed

# 7. Start the dev server
bun run dev
```

Open http://localhost:3000 — you'll be redirected to `/ar` (default Arabic).

### Test Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@boilerplate.dev | admin12345 |
| Manager | manager@boilerplate.dev | manager12345 |
| User | user@boilerplate.dev | user12345 |

## 📚 Documentation

- [Setup Guide](docs/SETUP.md) — detailed environment setup for all services
- [Deployment Guide](docs/DEPLOYMENT.md) — Railway deployment + CI/CD
- [Architecture](docs/ARCHITECTURE.md) — folder structure, data flow, design decisions

## 🗂 Project Structure

```
.
├── prisma/
│   └── schema.prisma              # Database schema (User, Account, Payment, Notification, etc.)
├── src/
│   ├── app/
│   │   ├── [locale]/              # All locale-prefixed routes
│   │   │   ├── layout.tsx         # Locale layout (i18n, theme, providers)
│   │   │   ├── page.tsx           # Landing page
│   │   │   ├── auth/              # Login, register, error, forgot-password
│   │   │   ├── dashboard/         # Protected dashboard routes
│   │   │   │   ├── page.tsx       # Overview (KPIs, charts, recent activity)
│   │   │   │   ├── users/         # User management (MANAGER+)
│   │   │   │   ├── payments/      # Payment history
│   │   │   │   ├── notifications/ # Notification center + preferences
│   │   │   │   ├── analytics/     # Charts and KPIs (MANAGER+)
│   │   │   │   ├── audit/         # Audit log (ADMIN)
│   │   │   │   └── settings/      # System settings (ADMIN)
│   │   │   └── forbidden/         # 403 page
│   │   ├── api/
│   │   │   ├── auth/              # NextAuth routes + register
│   │   │   ├── notifications/     # Notification CRUD
│   │   │   ├── payments/          # Payment + Moyasar webhook
│   │   │   ├── users/             # User management API
│   │   │   ├── audit/             # Audit log API
│   │   │   ├── uploadthing/       # File upload route
│   │   │   └── health/            # Health check endpoint
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── auth/                  # Login + register forms
│   │   ├── dashboard/             # Sidebar, topbar, charts, tables
│   │   ├── theme-provider.tsx
│   │   └── query-provider.tsx
│   ├── lib/
│   │   ├── auth.ts                # NextAuth v5 config
│   │   ├── rbac.ts                # Role helpers (requireRole, can)
│   │   ├── password.ts            # bcrypt hashing
│   │   ├── audit.ts               # Audit log helper
│   │   ├── db.ts                  # Prisma client
│   │   ├── redis.ts               # Redis client (BullMQ)
│   │   ├── logger.ts              # Pino logger
│   │   ├── sentry.ts              # Sentry init
│   │   ├── email.ts               # Resend sender
│   │   ├── push.ts                # FCM sender
│   │   ├── notifications.ts       # Multi-channel notifications
│   │   ├── format.ts              # Currency/date/number formatters
│   │   ├── queues/
│   │   │   ├── email-queue.ts     # BullMQ email worker
│   │   │   └── push-queue.ts      # BullMQ push worker
│   │   ├── email-templates/       # React Email templates
│   │   └── payments/
│   │       └── moyasar.ts         # Moyasar SDK wrapper
│   ├── i18n/
│   │   ├── routing.ts             # Locale config (ar, en)
│   │   ├── request.ts             # next-intl request config
│   │   └── navigation.ts          # Locale-aware Link, useRouter
│   ├── messages/
│   │   ├── ar.json                # Arabic translations
│   │   └── en.json                # English translations
│   └── middleware.ts              # i18n + auth + RBAC
├── messages/                      # (alias of src/messages — used by next-intl)
├── tests/
│   ├── unit/                      # Vitest unit tests
│   └── e2e/                       # Playwright E2E tests
├── scripts/
│   ├── seed.ts                    # Database seed
│   └── worker.ts                  # BullMQ worker entrypoint
├── docs/                          # Documentation
├── .github/workflows/ci-cd.yml    # GitHub Actions
├── railway.toml                   # Railway config (web + worker services)
├── Dockerfile                     # Production Docker image
├── docker-compose.yml             # Local Postgres + Redis
├── .env.example                   # Environment template
└── package.json
```

## 🧪 Testing

```bash
# Unit tests
bun run test

# Watch mode
bun run test:watch

# E2E tests (requires dev server running)
bun run test:e2e

# Install Playwright browsers (first time only)
bun run test:e2e:install
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start dev server on port 3000 |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run typecheck` | TypeScript type checking |
| `bun run db:push` | Push schema to DB |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Create + apply migration |
| `bun run db:studio` | Open Prisma Studio |
| `bun run db:seed` | Seed demo data |
| `bun run worker:start` | Start BullMQ worker process |
| `bun run email:dev` | Local email preview (port 3001) |
| `bun run test` | Run unit tests |
| `bun run test:e2e` | Run E2E tests |

## 🌍 i18n

- **Arabic (ar)** — default, RTL
- **English (en)** — LTR

Add a new locale:
1. Add to `locales` array in `src/i18n/routing.ts`
2. Create `messages/<locale>.json` with translations
3. Add static import in `src/i18n/request.ts`

Switching locale at runtime: click the language icon in the topbar, or visit `/<locale>/...`.

## 🔐 Authentication

- **Email/password** — bcrypt hashing (12 rounds)
- **Google OAuth** — set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`
- **GitHub OAuth** — set `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`
- **Sessions** — JWT-based (30 days), stateless, serverless-friendly

### Roles

| Role | Permissions |
|------|------------|
| `USER` | Default — access own dashboard, notifications, payments |
| `MANAGER` | + View/manage all users, payments, analytics |
| `ADMIN` | + View audit log, system settings |

Use helpers from `@/lib/rbac`:
```ts
import { requireRole, requireUser, can } from '@/lib/rbac';

// In a server component / route handler:
const session = await requireRole('ADMIN'); // redirects to /forbidden if unauthorized

// Client-side check:
if (can(user.role, 'MANAGER')) { ... }
```

## 💳 Payments (Moyasar)

Initiate a payment:
```ts
import { moyasar } from '@/lib/payments/moyasar';

const { db, moyasar: moyasarPayment } = await moyasar.createPayment({
  userId: session.user.id,
  amount: 99.99, // SAR
  description: 'Pro plan - 1 year',
  callbackUrl: 'https://yourapp.com/dashboard/billing',
});
// Redirect user to moyasarPayment.source.transaction_url
```

Webhooks are handled at `POST /api/payments/webhook`. Configure the webhook URL in your Moyasar dashboard and set `MOYASAR_WEBHOOK_SECRET`.

## 🔔 Notifications

Send a multi-channel notification:
```ts
import { notify } from '@/lib/notifications';

await notify.send({
  userId: 'xxx',
  title: 'Order shipped',
  body: 'Your order #123 has been dispatched.',
  type: 'success',
  link: '/orders/123',
  // channels: ['IN_APP', 'EMAIL', 'PUSH']  // optional; defaults to user prefs
});
```

User preferences (notifyInApp / notifyEmail / notifyPush) are respected by default. Override with explicit `channels`.

## 📝 License

MIT — use this boilerplate for any project, commercial or otherwise.
