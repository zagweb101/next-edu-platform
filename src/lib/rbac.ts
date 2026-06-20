/**
 * Authorization helpers — RBAC checks
 * Usage:
 *   import { requireRole, can } from '@/lib/rbac';
 *   await requireRole('ADMIN');           // throws if not admin
 *   if (can(user.role, 'MANAGER')) { ... }
 */
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Role } from '@prisma/client';

export type { Role };

/** Role hierarchy: higher index = more permissions */
export const ROLE_HIERARCHY: Role[] = ['USER', 'MANAGER', 'ADMIN'];

/**
 * Check if a role has permission (i.e., is at or above the required level).
 */
export function can(userRole: Role | undefined, required: Role): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(required);
}

/**
 * Server-side: require the current user to have at least the given role.
 * Redirects to login if unauthenticated, 403 page if unauthorized.
 */
export async function requireRole(role: Role) {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/login?callbackUrl=' + encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL || '/'));
  }
  if (!can(session.user.role, role)) {
    redirect('/forbidden');
  }
  return session;
}

/**
 * Server-side: just require an authenticated user (any role).
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/login');
  }
  return session;
}

/**
 * Server-side: get the current session if any (does not throw).
 */
export async function getSession() {
  return auth();
}
