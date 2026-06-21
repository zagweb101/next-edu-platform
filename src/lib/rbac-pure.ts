/**
 * Pure RBAC helpers — no auth dependency, safe for testing
 */
import type { Role } from '@prisma/client';

export type { Role };

/** Role hierarchy: STUDENT < TEACHER < ADMIN */
export const ROLE_HIERARCHY: Role[] = ['STUDENT', 'TEACHER', 'ADMIN'];

/**
 * Check if a role has permission (i.e., is at or above the required level).
 */
export function can(userRole: Role | undefined, required: Role): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(required);
}

/**
 * Check if a user's role matches any of the allowed roles.
 */
export function hasRole(userRole: Role | undefined, allowed: Role[]): boolean {
  if (!userRole) return false;
  return allowed.includes(userRole);
}
