/**
 * Root redirect — `/` redirects to `/ar` (default locale)
 * This is needed because we use localePrefix: 'always'
 */
import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
