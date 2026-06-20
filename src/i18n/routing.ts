/**
 * Routing configuration for next-intl
 * - Locales: ['ar', 'en']
 * - Default: 'ar' (RTL)
 * - localePrefix: 'always' — every URL has a locale prefix (more predictable)
 */
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];
