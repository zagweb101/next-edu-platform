# Architecture

This document explains the design decisions, data flow, and key abstractions in this boilerplate.

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Folder Structure](#folder-structure)
3. [Request Lifecycle](#request-lifecycle)
4. [Authentication Flow](#authentication-flow)
5. [Notification System](#notification-system)
6. [Payment Flow](#payment-flow)
7. [Background Jobs](#background-jobs)
8. [i18n & RTL](#i18n--rtl)
9. [Database Schema](#database-schema)
10. [Design Decisions](#design-decisions)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Browser / Client                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js 16 App Router                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Middleware (proxy.ts)                                  │    │
│  │  - i18n locale routing (next-intl)                      │    │
│  │  - Auth check (NextAuth JWT)                            │    │
│  │  - Role-based redirects                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Routes (/ar, /en, /ar/dashboard/*, /api/*)             │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────┬────────────────┬──────────────────┬─────────────────────┘
       │                │                  │
       ▼                ▼                  ▼
┌──────────┐    ┌──────────────┐    ┌──────────────┐
│ PostgreSQL│    │    Redis     │    │   External   │
│ (Prisma)  │    │  (BullMQ)    │    │   Services   │
└──────────┘    └──────┬───────┘    └──────────────┘
                       │
                       ▼
                ┌──────────────┐
                │   Worker     │ ← separate process (railway service)
                │  - email     │
                │  - push      │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │ Resend / FCM │
                └──────────────┘
```

### Two processes

The boilerplate runs as **two separate processes** in production:

1. **Web** — the Next.js server. Handles HTTP requests, enqueues background jobs.
2. **Worker** — a long-running Node/Bun process. Picks up jobs from Redis and processes them (sends emails, sends push notifications).

This separation is important because:
- The web process must be stateless and fast (serverless-friendly)
- The worker process can be slow (email APIs take 1-3 seconds) without blocking user requests
- They can scale independently (e.g., 3 web instances + 1 worker)

---

## Folder Structure

See the [README](../README.md#-project-structure) for the full tree.

### Key conventions

| Folder | What lives here |
|--------|----------------|
| `src/app/` | Next.js App Router pages and API routes |
| `src/app/[locale]/` | Locale-prefixed UI routes (i18n-aware) |
| `src/app/api/` | API routes (no locale prefix) |
| `src/components/` | React components |
| `src/components/ui/` | shadcn/ui primitives (button, card, etc.) |
| `src/components/dashboard/` | Dashboard-specific components |
| `src/lib/` | Business logic, no React |
| `src/lib/queues/` | BullMQ queue definitions + workers |
| `src/lib/email-templates/` | React Email templates |
| `src/lib/payments/` | Payment gateway integrations |
| `src/i18n/` | next-intl configuration |
| `src/messages/` | Translation JSON files |
| `messages/` | Symlink target (same as src/messages) |
| `prisma/` | Prisma schema + migrations |
| `scripts/` | Standalone scripts (seed, worker) |
| `tests/` | Vitest + Playwright tests |
| `docs/` | Documentation |

---

## Request Lifecycle

### Typical page load (e.g., `/ar/dashboard`)

```
1. Browser → GET /ar/dashboard
2. Next.js receives request
3. Middleware runs:
   a. next-intl validates locale prefix (/ar/ is valid)
   b. Auth check: get JWT token from cookie
      - If no token → redirect to /ar/auth/login
      - If token has role < MANAGER for /dashboard/users → redirect to /ar/forbidden
   c. Pass through
4. Route handler: src/app/[locale]/dashboard/page.tsx
   a. LocaleLayout renders (sets <html lang>, providers)
   b. DashboardLayout renders (sidebar, topbar)
   c. Page component runs:
      - Calls db.user.count(), db.payment.aggregate(), etc.
      - Renders KPIs, charts, tables
5. HTML returned to browser
6. Client components hydrate, fetch data via TanStack Query
```

### API request (e.g., `GET /api/notifications`)

```
1. Browser → GET /api/notifications
2. Next.js receives request
3. Middleware runs:
   - Skips /api/auth and /api/health (passes through)
   - For other API routes, runs i18n + auth
4. Route handler: src/app/api/notifications/route.ts
   a. Calls auth() to get session
   b. If no session → 401 UNAUTHORIZED
   c. Queries DB for notifications
   d. Returns JSON
5. Browser receives JSON
```

---

## Authentication Flow

### Sign in with credentials

```
1. User submits login form
2. Client calls signIn('credentials', { email, password })
3. NextAuth POST /api/auth/callback/credentials
4. authorize() function in src/lib/auth.ts:
   a. Look up user by email
   b. Compare bcrypt hashes
   c. If match → return user object with role
   d. If no match → return null
5. NextAuth creates JWT containing { id, email, role }
6. JWT stored in cookie (httpOnly, secure)
7. Client redirects to /dashboard
```

### Sign in with Google

```
1. User clicks "Sign in with Google"
2. Redirect to Google OAuth consent
3. Google redirects back to /api/auth/callback/google
4. NextAuth exchanges code for profile
5. PrismaAdapter creates/finds User + Account records
6. JWT created, cookie set
7. Redirect to /dashboard
```

### Session validation on each request

```
1. Browser sends cookie with JWT
2. Middleware calls getToken() to decode JWT (no DB lookup)
3. If valid → request proceeds
4. Server components call auth() to get full session (also JWT-based, no DB)
5. Role checks via can(session.user.role, 'ADMIN')
```

### Why JWT sessions (not database sessions)?

- **Serverless-friendly**: No DB lookup per request (faster, cheaper)
- **Scales horizontally**: Any instance can validate the JWT
- **Trade-off**: Role changes take up to 30 days to propagate (JWT maxAge)
  - Mitigation: Use `trigger: 'update'` to refresh the JWT when roles change
  - Or set a shorter `maxAge` (e.g., 24h)

---

## Notification System

### Three channels, one API

```ts
await notify.send({
  userId: 'xxx',
  title: 'Order shipped',
  body: 'Your order has been dispatched.',
  channels: ['IN_APP', 'EMAIL', 'PUSH'],  // optional
});
```

### Channel resolution

If `channels` is not specified, the user's preferences are used:
- `user.notifyInApp` → IN_APP
- `user.notifyEmail` → EMAIL
- `user.notifyPush` → PUSH

### Per-channel delivery

#### IN_APP

Always creates a record in the `Notification` table with `status: 'DELIVERED'`. The notification center polls `GET /api/notifications?count=unread` every 30 seconds.

#### EMAIL

1. If Redis is available: enqueue a job to `emailQueue`
2. Worker picks up job, calls `sendEmail()` (Resend)
3. If Resend fails: BullMQ retries 3x with exponential backoff
4. If Redis is NOT available: send immediately (synchronous, blocks request)

#### PUSH

1. Look up all FCM tokens for the user (one user → many devices)
2. If tokens exist: enqueue a job to `pushQueue`
3. Worker calls Firebase Admin SDK to send multicast
4. Tokens that fail with "UNREGISTERED" should be marked inactive (TODO)

---

## Payment Flow

### Initiate payment

```
1. Client calls POST /api/payments with { amount, description, callbackUrl }
2. Server calls moyasar.createPayment():
   a. POST to Moyasar API with amount in halalas (× 100)
   b. Moyasar returns payment object with source.transaction_url
   c. Save Payment record in DB with status: 'INITIATED'
3. Return { moyasar: { source: { transaction_url } } } to client
4. Client redirects user to transaction_url (Moyasar-hosted form)
```

### Complete payment (webhook)

```
1. User enters card details on Moyasar
2. Moyasar processes payment
3. Moyasar POST /api/payments/webhook with payment object
4. Server verifies HMAC signature
5. Server calls moyasar.fetchAndUpdate() to sync DB
6. If status === 'PAID':
   a. Update Payment record
   b. Send "Payment successful" notification (in-app + email + push)
   c. Create audit log entry
7. Return 200 OK to Moyasar
```

### Refund flow

```
1. Admin clicks "Refund" in dashboard
2. Server calls moyasar.refund(moyasarId, amount?)
3. Moyasar processes refund
4. Update Payment record: status='REFUNDED', refundedAmount
5. Create audit log entry
6. Notify user
```

---

## Background Jobs

### Architecture

```
Web process                  Redis                   Worker process
─────────────                ─────                   ──────────────
notify.send()                
  ↓                          
emailQueue.add('send', {})   →  bull:email:wait  →   Worker polls queue
                                (Redis list)          ↓
                                                     sendEmail() via Resend
                                                     ↓
                                                     On success: job removed
                                                     On failure: retry 3x
```

### Queue configuration

- **Email queue**: 3 retries, exponential backoff (5s, 10s, 20s)
- **Push queue**: 3 retries, exponential backoff
- **Job retention**: 100 completed + 200 failed jobs per queue

### Graceful shutdown

The worker handles SIGINT/SIGTERM:
1. Stops accepting new jobs
2. Waits for in-progress jobs to finish (up to 30s)
3. Exits cleanly

This prevents jobs from being marked as "failed" when Railway redeploys.

### Why BullMQ (not Bull)?

BullMQ is the actively-maintained successor to Bull. It has:
- Better TypeScript support
- Cleaner API
- Better performance
- Active development

---

## i18n & RTL

### Locale routing

- Locales: `ar` (default, RTL) and `en` (LTR)
- URL structure: `/ar/...`, `/en/...` (every URL has a locale prefix)
- Root `/` redirects to `/ar` (default locale)

### How RTL works

1. `[locale]/layout.tsx` sets `<html dir="rtl" lang="ar">` for Arabic
2. Tailwind CSS 4 has built-in RTL support via `ps-`, `pe-`, `ms-`, `me-` (logical properties)
3. Components use logical properties (e.g., `ps-3` instead of `pl-3`) so they flip automatically
4. The sidebar collapses to the right in RTL mode

### Translations

All UI strings live in `src/messages/<locale>.json`. Use:

```tsx
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations();
  return <h1>{t('dashboard.welcome', { name: 'Ahmed' })}</h1>;
}
```

For server components:

```tsx
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations();
  return <h1>{t('dashboard.title')}</h1>;
}
```

---

## Database Schema

### Core models

| Model | Purpose |
|-------|---------|
| `User` | Main user record. Has role, locale, notification prefs |
| `Account` | OAuth provider accounts (Google, GitHub) |
| `Session` | DB sessions (unused if using JWT — kept for adapter compatibility) |
| `VerificationToken` | Email verification tokens |
| `RoleAssignment` | Multi-role support (currently single-role via User.role) |
| `Notification` | In-app notifications + email/push records |
| `FcmToken` | Push notification device tokens |
| `Payment` | Moyasar payment records |
| `Subscription` | Recurring billing (Moyasar tokens) |
| `AuditLog` | Track all sensitive actions |
| `UploadFile` | File upload metadata (UploadThing) |
| `Setting` | System-wide key/value settings |

### Key relationships

```
User 1──N Account          (one user, many OAuth accounts)
User 1──N Session          (one user, many sessions)
User 1──N Notification     (one user, many notifications)
User 1──N FcmToken         (one user, many devices)
User 1──N Payment          (one user, many payments)
User 1──N Subscription     (one user, many subscriptions)
User 1──N AuditLog         (one user, many audit entries)
Payment N──1 Subscription  (a payment may belong to a subscription)
```

---

## Design Decisions

### Why NextAuth v5 (beta) instead of v4?

- v5 has first-class App Router support
- v5 has better TypeScript types
- v5 has cleaner API (`auth()`, `signIn()`, `signOut()` exports)
- v5 is the future — v4 is in maintenance mode

The "beta" label is misleading — v5 is widely used in production.

### Why SQLite as default (not Postgres)?

- Zero-config local dev: no Docker, no Postgres install
- The schema is portable — switch to Postgres in production by changing one line
- Faster iteration in early development

### Why BullMQ + Redis (not just async/await)?

- **Reliability**: Jobs survive server restarts (stored in Redis)
- **Retries**: Automatic exponential backoff for failed jobs
- **Visibility**: BullMQ has a nice UI (Bull Dashboard) for inspecting jobs
- **Scaling**: Multiple worker instances can consume from the same queue

For development, the boilerplate falls back to synchronous sending if Redis isn't available.

### Why Prisma (not Drizzle or raw SQL)?

- Best-in-class TypeScript support
- Schema migration system
- Type-safe queries
- Great documentation

Drizzle is faster (no Rust binary) but Prisma's DX is hard to beat.

### Why next-intl (not react-intl or i18next)?

- Built for Next.js App Router (server + client components)
- Type-safe message keys with `useTranslations`
- Built-in locale routing
- Active development

### Why shadcn/ui (not Material UI or Chakra)?

- You own the components (no library lock-in)
- Built on Radix UI (best-in-class accessibility)
- Tailwind CSS-native (no extra CSS-in-JS)
- Copy-paste model — customize freely

### Why Pino (not Winston)?

- 5-10x faster than Winston
- JSON output by default (great for log aggregation)
- Built-in redaction for sensitive fields
- pino-pretty for dev mode

### Why separate worker process (not in Next.js)?

Next.js serverless functions have a max execution time (10s on Vercel, configurable on Railway). Sending emails can take 1-3s, and processing 10 emails in a queue would time out.

A separate worker process has no time limit and can process jobs at its own pace.

---

## Extending the Boilerplate

### Add a new API route

1. Create `src/app/api/<name>/route.ts`
2. Export `GET`, `POST`, `PATCH`, `DELETE` functions
3. Use `auth()` to get session, `db` for database, `audit.log()` for sensitive actions

### Add a new dashboard page

1. Create `src/app/[locale]/dashboard/<name>/page.tsx`
2. Use `requireRole()` to enforce RBAC
3. Add to `NAV_ITEMS` in `src/components/dashboard/sidebar.tsx`

### Add a new notification type

Just call `notify.send()` with any `type` value. The notification icon is determined by:
- `'info'` → Info icon (blue)
- `'success'` → CheckCircle (green)
- `'warning'` → AlertTriangle (amber)
- `'error'` → AlertOctagon (red)

### Add a new payment gateway

1. Create `src/lib/payments/<gateway>.ts` with the same interface as `moyasar.ts`
2. Add a `provider` field to the Payment model
3. Switch on provider in your API routes

### Add a new locale

1. Add to `locales` array in `src/i18n/routing.ts`
2. Create `src/messages/<locale>.json`
3. Add static import in `src/i18n/request.ts`
4. (Optional) Add locale-specific date/number formatting in `src/lib/format.ts`
