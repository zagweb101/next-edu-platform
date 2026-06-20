/**
 * Sentry initialization — server-side
 * Only initialized when SENTRY_DSN is set.
 * Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
import * as Sentry from '@sentry/nextjs';

export function registerSentry() {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    environment: process.env.NODE_ENV,
    release: process.env.npm_package_version,
    profilesSampleRate: 0.1,
    // Filter out noisy errors
    ignoreErrors: [
      // NextAuth
      'NEXTAUTH',
      // Browser extensions
      'top.GLOBALS',
      'ResizeObserver loop',
    ],
    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
    ],
  });
}
