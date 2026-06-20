/**
 * Health check endpoint — used by Railway for uptime monitoring
 * Returns 200 OK if the app is running and DB is reachable.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, 'ok' | 'fail'> = {
    app: 'ok',
  };

  // DB check
  try {
    await db.$queryRaw`SELECT 1`;
    checks.db = 'ok';
  } catch (err) {
    logger.error({ err }, 'Health check: DB failed');
    checks.db = 'fail';
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');
  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || 'unknown',
    },
    { status: allOk ? 200 : 503 },
  );
}
