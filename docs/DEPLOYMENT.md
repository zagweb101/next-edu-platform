# Deployment Guide

This guide walks you through deploying the boilerplate to Railway with full CI/CD.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Railway Setup](#railway-setup)
3. [Environment Variables](#environment-variables)
4. [GitHub Actions CI/CD](#github-actions-cicd)
5. [First Deployment](#first-deployment)
6. [PR Previews](#pr-previews)
7. [Database Migrations](#database-migrations)
8. [Running the Worker](#running-the-worker)
9. [Monitoring](#monitoring)
10. [Alternative: Docker-only Deployment](#alternative-docker-only-deployment)

---

## Prerequisites

- A [Railway](https://railway.app) account
- A [GitHub](https://github.com) account with your boilerplate repo pushed
- API keys for the services you want to enable (Moyasar, Resend, Firebase, etc.)
- Railway CLI installed: `npm i -g @railway/cli`

---

## Railway Setup

### Step 1: Create a new Railway project

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Select your boilerplate repo
3. Railway will detect the `railway.toml` config and create two services:
   - **web** — the Next.js app
   - **worker** — the BullMQ background worker

### Step 2: Add plugins

In your Railway project, click "+" and add:

1. **PostgreSQL** — Railway will inject `DATABASE_URL` automatically
2. **Redis** — Railway will inject `REDIS_URL` automatically

### Step 3: Switch schema to PostgreSQL

Before deploying, update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // change from "sqlite"
  url      = env("DATABASE_URL")
}
```

Then commit and push.

---

## Environment Variables

Set these in Railway (Project → Variables). Variables marked **auto** are injected by Railway plugins.

### Required

| Variable | Value | Notes |
|----------|-------|-------|
| `AUTH_SECRET` | `openssl rand -base64 32` | Generate locally |
| `AUTH_URL` | `https://your-app.up.railway.app` | Your Railway domain |
| `DATABASE_URL` | (auto) | From Postgres plugin |
| `REDIS_URL` | (auto) | From Redis plugin |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.up.railway.app` | Same as AUTH_URL |
| `NEXT_PUBLIC_APP_NAME` | `My App` | Your app name |

### Optional (enable features)

| Variable | Service |
|----------|---------|
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google OAuth |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | GitHub OAuth |
| `MOYASAR_SECRET_KEY`, `MOYASAR_PUBLISHABLE_KEY`, `MOYASAR_WEBHOOK_SECRET` | Payments |
| `RESEND_API_KEY`, `EMAIL_FROM` | Email |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Push notifications |
| `UPLOADTHING_SECRET`, `UPLOADTHING_APP_ID` | File uploads |
| `SENTRY_DSN` | Error tracking |

### Important: AUTH_URL

After your first deploy, Railway will assign a domain like `web-production-xxxx.up.railway.app`. Update `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to match. Otherwise NextAuth will reject callbacks.

---

## GitHub Actions CI/CD

The boilerplate includes `.github/workflows/ci-cd.yml` which:

1. **On every PR**: runs lint, typecheck, unit tests, build
2. **On PR**: deploys a Railway preview environment
3. **On push to main**: deploys to Railway production

### Required GitHub Secrets

Go to your repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Description |
|--------|-------------|
| `RAILWAY_TOKEN` | Railway API token (generate at railway.app/account/tokens) |
| `RAILWAY_SERVICE_ID` | The web service ID (from Railway dashboard URL) |
| `RAILWAY_WORKER_ID` | The worker service ID (optional) |

### Disabling CI/CD

If you don't want CI/CD, just delete `.github/workflows/ci-cd.yml`. You can still deploy manually via:
```bash
railway up
```

---

## First Deployment

### Option A: Via Railway Dashboard

1. Push your code to GitHub
2. In Railway, click Deploy
3. Wait for the build to complete (~3-5 minutes)
4. Visit the Railway-provided URL

### Option B: Via Railway CLI

```bash
# Login
railway login

# Link to your Railway project
railway link

# Deploy
railway up
```

### Post-deploy steps

1. **Run database migrations** (see [Database Migrations](#database-migrations))
2. **Seed admin user** (see below)
3. **Configure webhook URLs** in Moyasar dashboard
4. **Update OAuth redirect URIs** in Google/GitHub consoles

### Seeding admin user on Railway

```bash
# Get a shell in your Railway web service
railway shell

# Run the seed script
bun run db:seed
```

Or use Railway's "Command" feature to run a one-off:
```bash
railway run bun run db:seed
```

---

## PR Previews

Railway automatically creates a preview environment for every PR. Each preview gets:
- Its own URL (e.g., `web-pr-123.up.railway.app`)
- Its own database (cloned from main, or empty — your choice)
- Its own Redis instance

To enable PR previews:

1. In Railway, go to Settings → Environments
2. Ensure "Preview" environment exists
3. Set the same env vars as production (or use the same variables)

The CI/CD pipeline automatically deploys to the preview environment when a PR is opened.

---

## Database Migrations

### For the first deploy

After the first deploy, run:
```bash
railway run bun run db:push
```

This pushes the schema to your Railway Postgres database.

### For ongoing schema changes

Use Prisma migrations for production:

```bash
# Create a migration locally
bun run db:migrate -- --name add_new_table

# Commit the migration files
git add prisma/migrations/
git commit -m "Add new table"

# On deploy, Railway will run `prisma migrate deploy` automatically
# (configure this in railway.toml's buildCommand)
```

To enable auto-migrations on Railway, update `railway.toml`:

```toml
[services.build]
buildCommand = "bun install && bun run db:generate && bun run db:migrate deploy && bun run build"
```

---

## Running the Worker

The worker process handles async jobs (email sending, push notifications). Without it, jobs are queued but never processed.

### On Railway

The `railway.toml` already defines a `worker` service. Railway will start it automatically.

Verify it's running:
1. Go to your Railway project
2. Click on the `worker` service
3. Check the Deployments tab — should show "Active"
4. Check the Logs tab — should show "Workers started"

### Scaling the worker

For high traffic, scale the worker horizontally:
1. In Railway, click the `worker` service
2. Settings → Scaling
3. Set min/max instances (e.g., 1-3)

Each worker instance processes jobs in parallel from the same Redis queue.

---

## Monitoring

### Health check endpoint

`GET /api/health` returns:
```json
{
  "status": "healthy",
  "checks": {
    "app": "ok",
    "db": "ok"
  },
  "timestamp": "...",
  "version": "1.0.0"
}
```

Railway uses this for health checks (configured in `railway.toml`).

### Logs

- **App logs** — Pino structured JSON logs (visible in Railway → your service → Logs)
- **Worker logs** — Same format, separate service in Railway
- **Sentry** — Errors and performance traces (if `SENTRY_DSN` is set)

### Sentry setup

1. Create a Next.js project on Sentry
2. Get the DSN
3. Set `SENTRY_DSN` env var on Railway
4. (Optional) For source maps, set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` and add a Sentry build step

---

## Alternative: Docker-only Deployment

If you prefer Docker over Railway, the boilerplate includes a multi-stage `Dockerfile`.

### Build the image

```bash
docker build -t my-app .
```

### Run the web service

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  -e AUTH_SECRET="..." \
  -e AUTH_URL="https://yourdomain.com" \
  my-app
```

### Run the worker

```bash
docker run \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  my-app \
  bun run scripts/worker.ts
```

### Deploy to any container platform

The Docker image works on:
- Fly.io
- Render
- Google Cloud Run
- AWS ECS
- Azure Container Apps
- Any Kubernetes cluster

Just set the same env vars and expose port 3000.

---

## Troubleshooting

### Build fails: "Prisma Client not generated"

Make sure your `buildCommand` includes `bun run db:generate`:
```toml
[services.build]
buildCommand = "bun install && bun run db:generate && bun run build"
```

### App boots but login fails

Check that:
1. `AUTH_SECRET` is set
2. `AUTH_URL` matches your Railway domain exactly (including `https://`)
3. Database is migrated (`bun run db:push`)

### Emails not sending

1. Check `RESEND_API_KEY` is set
2. Check `EMAIL_FROM` uses a verified domain
3. Check the worker is running (Logs should show "Workers started")
4. Look for "Email job failed" in worker logs

### Webhooks not arriving

1. Verify webhook URL in Moyasar dashboard: `https://yourdomain.com/api/payments/webhook`
2. Verify `MOYASAR_WEBHOOK_SECRET` matches what Moyasar shows
3. Check Railway logs for `Moyasar webhook` entries
4. If signature verification fails, temporarily remove `MOYASAR_WEBHOOK_SECRET` to debug

### Worker not processing jobs

1. Verify `REDIS_URL` is set on the worker service (same as web)
2. Check worker logs for "Redis connected"
3. Verify the queue has pending jobs (Redis Insights / `redis-cli LLEN bull:email:wait`)
