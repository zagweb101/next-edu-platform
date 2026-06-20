# Setup Guide

Detailed setup instructions for every service this boilerplate integrates with.

## Table of Contents

1. [Local Development (Zero-Config)](#1-local-development-zero-config)
2. [Database — PostgreSQL](#2-database--postgresql)
3. [Authentication — NextAuth v5](#3-authentication--nextauth-v5)
4. [Payments — Moyasar](#4-payments--moyasar)
5. [Email — Resend](#5-email--resend)
6. [Push Notifications — Firebase FCM](#6-push-notifications--firebase-fcm)
7. [File Uploads — UploadThing](#7-file-uploads--uploadthing)
8. [Background Jobs — Redis + BullMQ](#8-background-jobs--redis--bullmq)
9. [Error Tracking — Sentry](#9-error-tracking--sentry)
10. [Optional: Switch SQLite to PostgreSQL](#10-optional-switch-sqlite-to-postgresql)

---

## 1. Local Development (Zero-Config)

The boilerplate ships with **SQLite** as the default database so you can start coding immediately without installing PostgreSQL.

```bash
# Install dependencies
bun install

# Copy env template
cp .env.example .env

# Generate AUTH_SECRET (required)
openssl rand -base64 32
# Paste into .env as AUTH_SECRET="..."

# Push DB schema
bun run db:push

# Seed demo data (admin, manager, user accounts)
bun run db:seed

# Start dev server
bun run dev
```

Open http://localhost:3000 — you'll be redirected to `/ar`.

### Test Accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@boilerplate.dev | admin12345 |
| Manager | manager@boilerplate.dev | manager12345 |
| User | user@boilerplate.dev | user12345 |

---

## 2. Database — PostgreSQL

For production, use PostgreSQL. Two options:

### Option A: Local Docker (recommended for dev)

```bash
# Start Postgres + Redis in background
docker compose up -d
```

This starts:
- PostgreSQL on `localhost:5432` (user: `postgres`, pass: `postgres`, db: `boilerplate`)
- Redis on `localhost:6379`

Then update your `.env`:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/boilerplate?schema=public"
REDIS_URL="redis://localhost:6379"
```

### Option B: Railway Postgres (for production)

1. Create a Railway project
2. Add the PostgreSQL plugin
3. Railway will inject `DATABASE_URL` automatically — no need to set it manually

---

## 3. Authentication — NextAuth v5

### Required env vars

```bash
AUTH_SECRET="<openssl rand -base64 32>"
AUTH_URL="http://localhost:3000"  # your app URL
```

### Optional: Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials (Web application)
3. Add authorized redirect URI: `https://yourdomain.com/api/auth/callback/google`
4. Copy Client ID and Secret to `.env`:
   ```bash
   AUTH_GOOGLE_ID="..."
   AUTH_GOOGLE_SECRET="..."
   ```

### Optional: GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set callback URL: `https://yourdomain.com/api/auth/callback/github`
4. Copy Client ID and Secret to `.env`:
   ```bash
   AUTH_GITHUB_ID="..."
   AUTH_GITHUB_SECRET="..."
   ```

### Roles

The User model has a `role` field with three values:
- `USER` (default) — basic access
- `MANAGER` — can manage users, payments, view analytics
- `ADMIN` — full access including audit log and settings

Change a user's role via Prisma Studio:
```bash
bun run db:studio
```

---

## 4. Payments — Moyasar

### Get API keys

1. Sign up at [Moyasar Dashboard](https://dashboard.moyasar.com)
2. Go to Settings → API Keys
3. Copy your **Secret Key** and **Publishable Key**

### Env vars

```bash
MOYASAR_SECRET_KEY="sk_test_..."       # or sk_live_... for production
MOYASAR_PUBLISHABLE_KEY="pk_test_..."
MOYASAR_WEBHOOK_SECRET="wh_secret_..."  # from Settings → Webhooks
```

### Configure webhook

1. In Moyasar dashboard, go to Settings → Webhooks
2. Add endpoint: `https://yourdomain.com/api/payments/webhook`
3. Copy the webhook secret to `MOYASAR_WEBHOOK_SECRET`

### Supported payment methods

- Credit/Debit Card (Visa, Mastercard, mada)
- Apple Pay
- STC Pay

### Test cards

Use Moyasar's test cards from their [docs](https://docs.moyasar.com/testing):
- `4111 1111 1111 1111` — Visa success
- `4111 1111 1111 1112` — Visa failure
- `5123 4500 0000 0008` — mada success
- `4000 0000 0000 0002` — Card declined

---

## 5. Email — Resend

### Get API key

1. Sign up at [Resend](https://resend.com)
2. Go to API Keys → Create API Key
3. Copy the key (starts with `re_...`)

### Env vars

```bash
RESEND_API_KEY="re_..."
EMAIL_FROM="Your App <noreply@yourdomain.com>"
```

### Verify your domain

For production, verify your sending domain in Resend's dashboard. Otherwise you can only send to your own email (test mode).

### Preview email templates locally

```bash
bun run email:dev
# Opens http://localhost:3001 with live preview of all templates
```

---

## 6. Push Notifications — Firebase FCM

### Create Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Add a Web App to get the config (you'll need this for the client SDK)
4. Go to Project Settings → Service Accounts → Generate new private key
5. Download the JSON file

### Env vars

Open the downloaded JSON and copy these fields to `.env`:

```bash
FIREBASE_PROJECT_ID="..."             # project_id from JSON
FIREBASE_CLIENT_EMAIL="..."           # client_email from JSON
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Note: The private key must include `\n` literal characters. If you copy-paste, replace newlines with `\n`.

### Client-side FCM setup

For the browser to receive push notifications, you also need:
1. A `firebase-messaging-sw.js` file in `/public`
2. Generate a VAPID key pair in Firebase Console (Project Settings → Cloud Messaging → Web Push certificates)
3. Use the FCM token from `getToken()` and POST it to your API (e.g., `/api/users/me/fcm-token`) to persist

### Without Firebase configured

The boilerplate gracefully handles missing Firebase env vars — push notifications are silently skipped, and a warning is logged. All other notification channels still work.

---

## 7. File Uploads — UploadThing

### Get API keys

1. Sign up at [UploadThing](https://uploadthing.com)
2. Create a new app
3. Copy the secret key and app ID

### Env vars

```bash
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="..."
```

### Customizing file types

Edit `src/app/api/uploadthing/core.ts` to change allowed file types and size limits.

---

## 8. Background Jobs — Redis + BullMQ

Used for: email queue, push notification queue.

### Without Redis

If `REDIS_URL` is not set, the boilerplate falls back to sending emails and pushes **immediately** (synchronously) instead of queueing. This is fine for development but **not recommended for production** — long email sends will block your request.

### With Redis

```bash
# Local (via docker compose)
docker compose up -d redis

# Or use Railway Redis plugin
# Railway will inject REDIS_URL automatically
```

### Starting the worker

The Next.js web app **only enqueues** jobs. To process them, start the worker process:

```bash
# Local
bun run worker:start

# Railway: this becomes a separate "worker" service (configured in railway.toml)
```

The worker process runs continuously, picking up jobs from Redis.

---

## 9. Error Tracking — Sentry

### Get DSN

1. Sign up at [Sentry](https://sentry.io)
2. Create a new Next.js project
3. Copy the DSN

### Env vars

```bash
SENTRY_DSN="https://xxx@sentry.io/123"
SENTRY_AUTH_TOKEN="..."     # only needed for source map uploads
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"
```

Without Sentry configured, the `registerSentry()` function is a no-op. Your app will still work — errors just won't be reported to Sentry.

---

## 10. Optional: Switch SQLite to PostgreSQL

The default schema uses SQLite for zero-config local dev. For production, switch to PostgreSQL:

### Step 1: Update `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"   // changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

### Step 2: Update field types (optional but recommended)

For PostgreSQL, you can use more precise types:

```prisma
// In Payment model:
amount          Decimal  @db.Decimal(10, 2)
refundedAmount  Decimal  @db.Decimal(10, 2) @default(0)

// In Subscription model:
amount           Decimal  @db.Decimal(10, 2)

// In Account model:
refresh_token     String? @db.Text
access_token      String? @db.Text
id_token          String? @db.Text

// In Setting model:
value     String   @db.Text
```

### Step 3: Update `.env`

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/boilerplate?schema=public"
```

### Step 4: Push schema

```bash
bun run db:push
```

---

## Troubleshooting

### `EADDRINUSE: address already in use :::3000`

Another process is using port 3000. Kill it:
```bash
lsof -ti:3000 | xargs kill -9
# or
pkill -f "next dev"
```

### Prisma client out of sync

If you see TypeScript errors about missing Prisma types:
```bash
bun run db:generate
```

### NextAuth `AUTH_SECRET` error

You must set `AUTH_SECRET`. Generate one:
```bash
openssl rand -base64 32
```

### Webhook signature verification fails

Make sure you're using the **raw request body** for verification. The webhook handler already does this — don't change `req.text()` to `req.json()` in `src/app/api/payments/webhook/route.ts`.
