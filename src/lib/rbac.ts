/**
 * Authorization helpers — RBAC checks for the Education Platform.
 *
 * Roles (in order of permissions):
 *   - STUDENT  — can browse, enroll, watch, take quizzes, leave reviews
 *   - TEACHER  — can create/edit their own courses, view their students
 *   - ADMIN    — full access to everything (users, all courses, payments, audit)
 *
 * Usage:
 *   import { requireRole, can, hasRole } from '@/lib/rbac';
 *   await requireRole('TEACHER');
 *   if (can(user.role, 'TEACHER')) { ... }
 *   if (hasRole(user.role, ['TEACHER', 'ADMIN'])) { ... }
 */
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { Role } from '@prisma/client';

export type { Role };

/**
 * Check if a user's role matches any of the allowed roles.
 * This is the most flexible check — use it for fine-grained permissions.
 */
export function hasRole(userRole: Role | undefined, allowed: Role[]): boolean {
  if (!userRole) return false;
  return allowed.includes(userRole);
}

/**
 * Role hierarchy for "minimum required" checks.
 * Note: STUDENT and TEACHER are NOT hierarchical — a TEACHER is not
 * "above" a STUDENT; they have different capabilities. Only ADMIN has
 * elevated power over both.
 */
export const ROLE_HIERARCHY: Role[] = ['STUDENT', 'TEACHER', 'ADMIN'];

/**
 * Check if a role meets a minimum required level.
 * Use this only for hierarchy-based checks (e.g., admin-only routes).
 * For specific role checks (e.g., "is teacher OR admin"), use hasRole().
 */
export function can(userRole: Role | undefined, required: Role): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(required);
}

/**
 * Server-side: require the current user to have at least the given role.
 * Redirects to login if unauthenticated, /forbidden if unauthorized.
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
 * Server-side: require the current user to have ANY of the given roles.
 * Example: requireAnyRole(['TEACHER', 'ADMIN'])
 */
export async function requireAnyRole(roles: Role[]) {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/login?callbackUrl=' + encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL || '/'));
  }
  if (!hasRole(session.user.role, roles)) {
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

// ===================================================================
// Permission constants — declarative permission checks
// ===================================================================

export const PERMISSIONS = {
  // User management
  'user.view': ['ADMIN'],
  'user.create': ['ADMIN'],
  'user.update': ['ADMIN'],
  'user.delete': ['ADMIN'],

  // Course management
  'course.view': ['STUDENT', 'TEACHER', 'ADMIN'],
  'course.create': ['TEACHER', 'ADMIN'],
  'course.update': ['TEACHER', 'ADMIN'], // teacher only on own courses
  'course.delete': ['TEACHER', 'ADMIN'], // teacher only on own courses
  'course.publish': ['TEACHER', 'ADMIN'],

  // Enrollment
  'enroll.free': ['STUDENT', 'TEACHER', 'ADMIN'],
  'enroll.paid': ['STUDENT', 'TEACHER', 'ADMIN'],

  // Lessons
  'lesson.view': ['STUDENT', 'TEACHER', 'ADMIN'],
  'lesson.create': ['TEACHER', 'ADMIN'],
  'lesson.update': ['TEACHER', 'ADMIN'],
  'lesson.delete': ['TEACHER', 'ADMIN'],

  // Quizzes
  'quiz.take': ['STUDENT', 'TEACHER', 'ADMIN'],
  'quiz.create': ['TEACHER', 'ADMIN'],
  'quiz.update': ['TEACHER', 'ADMIN'],
  'quiz.viewAttempts': ['TEACHER', 'ADMIN'],

  // Reviews
  'review.create': ['STUDENT', 'TEACHER', 'ADMIN'],
  'review.delete': ['ADMIN'],

  // Certificates
  'certificate.issue': ['ADMIN'],
  'certificate.view': ['STUDENT', 'TEACHER', 'ADMIN'],
  'certificate.download': ['STUDENT', 'TEACHER', 'ADMIN'],

  // Payments & finance
  'payment.view': ['ADMIN'],
  'payment.refund': ['ADMIN'],

  // Audit log
  'audit.view': ['ADMIN'],

  // Analytics
  'analytics.view': ['TEACHER', 'ADMIN'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a user's role has a specific permission.
 */
export function hasPermission(userRole: Role | undefined, permission: Permission): boolean {
  if (!userRole) return false;
  const allowedRoles = PERMISSIONS[permission];
  return (allowedRoles as readonly Role[]).includes(userRole);
}
