/**
 * Unit test — RBAC helpers (pure functions only, no auth dependency)
 */
import { describe, it, expect } from 'vitest';
import { can, hasRole, ROLE_HIERARCHY } from '@/lib/rbac-pure';
import type { Role } from '@prisma/client';

describe('RBAC helpers', () => {
  it('ADMIN can do everything (hierarchy-based)', () => {
    expect(can('ADMIN' as Role, 'STUDENT')).toBe(true);
    expect(can('ADMIN' as Role, 'TEACHER')).toBe(true);
    expect(can('ADMIN' as Role, 'ADMIN')).toBe(true);
  });

  it('TEACHER can do STUDENT and TEACHER things but not ADMIN', () => {
    expect(can('TEACHER' as Role, 'STUDENT')).toBe(true);
    expect(can('TEACHER' as Role, 'TEACHER')).toBe(true);
    expect(can('TEACHER' as Role, 'ADMIN')).toBe(false);
  });

  it('STUDENT can only do STUDENT things', () => {
    expect(can('STUDENT' as Role, 'STUDENT')).toBe(true);
    expect(can('STUDENT' as Role, 'TEACHER')).toBe(false);
    expect(can('STUDENT' as Role, 'ADMIN')).toBe(false);
  });

  it('undefined role has no permissions', () => {
    expect(can(undefined, 'STUDENT')).toBe(false);
  });

  it('ROLE_HIERARCHY has 3 roles in correct order', () => {
    expect(ROLE_HIERARCHY).toEqual(['STUDENT', 'TEACHER', 'ADMIN']);
  });

  it('hasRole returns true when role is in allowed list', () => {
    expect(hasRole('TEACHER' as Role, ['TEACHER', 'ADMIN'])).toBe(true);
    expect(hasRole('ADMIN' as Role, ['TEACHER', 'ADMIN'])).toBe(true);
    expect(hasRole('STUDENT' as Role, ['TEACHER', 'ADMIN'])).toBe(false);
    expect(hasRole(undefined, ['TEACHER'])).toBe(false);
  });
});
