# Production Dockerfile — multi-stage build for Next.js 16 + Bun
# Based on the Next.js standalone output mode.

# ---- Stage 1: deps ----
FROM oven/bun:1.3 AS deps
WORKDIR /app

# Install dependencies using lockfile (faster, deterministic)
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# ---- Stage 2: builder ----
FROM oven/bun:1.3 AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (must run before build)
RUN bun run db:generate

# Set NEXT_TELEMETRY_DISABLED to keep build logs clean
ENV NEXT_TELEMETRY_DISABLED=1
# Enable standalone output (configured in next.config — see docs/SETUP.md)
ENV NEXT_OUTPUT_STANDALONE=1

RUN bun run build

# ---- Stage 3: runner ----
FROM oven/bun:1.3-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Run as non-root user for security
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy standalone build + static assets + public folder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma schema + migrations (for `prisma migrate deploy` at startup)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy scripts (worker.ts)
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Healthcheck — Railway will use /api/health
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Default: start the web app. Override CMD to run worker:
#   docker run ... bun run scripts/worker.ts
CMD ["bun", ".next/standalone/server.js"]
