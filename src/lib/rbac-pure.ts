/**
 * Pure RBAC helpers — no auth dependency, safe for testing
 */
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
