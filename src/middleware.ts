/**
 * Global proxy (formerly middleware) — combines:
 *   1. next-intl locale routing
 *   2. NextAuth session protection for /dashboard/*
 *   3. Role-based redirects (e.g., /dashboard/users requires MANAGER+)
 *
 * Note: Next.js 16 renamed "middleware" to "proxy" — kept the file name as
 * middleware.ts for backwards compatibility (Next.js still supports it).
 */
import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Routes that require authentication (matched against pathname WITHOUT locale prefix)
const PROTECTED_PREFIXES = ['/dashboard'];

// Routes that require specific roles
const ROLE_RULES: { pattern: RegExp; role: 'ADMIN' | 'MANAGER' | 'USER' }[] = [
  { pattern: /^\/dashboard\/users/, role: 'MANAGER' },
  { pattern: /^\/dashboard\/audit/, role: 'ADMIN' },
  { pattern: /^\/dashboard\/settings/, role: 'ADMIN' },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let all API routes pass through — they handle their own auth
  // (next-intl shouldn't try to localize API routes)
  if (
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  // Step 1: Let next-intl handle locale routing
  // next-intl will rewrite /ar/* and /en/* internally
  // and redirect / to /ar (or /en if that's the user's preferred locale)
  const intlResponse = intlMiddleware(req);

  // Check if route is protected (after stripping locale prefix)
  const localePattern = new RegExp(`^/(${routing.locales.join('|')})(/|$)`);
  const pathWithoutLocale = pathname.replace(localePattern, '/') || '/';

  const isProtected = PROTECTED_PREFIXES.some((p) => pathWithoutLocale.startsWith(p));
  if (!isProtected) {
    // For public routes, just return the intl response (rewrites/redirects)
    return intlResponse;
  }

  // For protected routes, we need to check auth.
  // But if intlResponse is a redirect (locale fix), let it through first.
  if (intlResponse instanceof NextResponse && intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  // Step 2: Check session
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!token) {
    const loginUrl = new URL(`/${routing.defaultLocale}/auth/login`, req.url);
    loginUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Step 3: Role-based check
  for (const rule of ROLE_RULES) {
    if (rule.pattern.test(pathWithoutLocale)) {
      const userRole = (token.role as string) || 'USER';
      const hierarchy = ['USER', 'MANAGER', 'ADMIN'];
      if (hierarchy.indexOf(userRole) < hierarchy.indexOf(rule.role)) {
        const forbiddenUrl = new URL(`/${routing.defaultLocale}/forbidden`, req.url);
        return NextResponse.redirect(forbiddenUrl);
      }
    }
  }

  return intlResponse;
}

export const config = {
  // Match all pathnames except for static files, API routes (non-auth), and Next internals
  matcher: ['/((?!api/health|api/auth|_next|_vercel|.*\\..*).*)'],
};
