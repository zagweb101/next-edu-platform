/**
 * Next.js instrumentation hook — runs once on server startup
 * Used to initialize Sentry, warm up connections, etc.
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  // Only run on the server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerSentry } = await import('@/lib/sentry');
    registerSentry();
  }
}
