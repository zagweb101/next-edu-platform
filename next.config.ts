/**
 * next-intl plugin configuration — request-scoped locale resolution
 */
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl({
  // Standalone output — required for Docker + Railway deployment
  // Generates a self-contained .next/standalone folder
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  // Sentry — hide source maps in production
  productionBrowserSourceMaps: false,
});
