/**
 * Unit test — RBAC helpers (pure functions only, no auth dependency)
 */
import { describe, it, expect } from 'vitest';
import { can, ROLE_HIERARCHY } from '@/lib/rbac-pure';
import type { Role } from '@prisma/client';

describe('RBAC helpers', () => {
  it('ADMIN can do everything', () => {
    expect(can('ADMIN' as Role, 'USER')).toBe(true);
    expect(can('ADMIN' as Role, 'MANAGER')).toBe(true);
    expect(can('ADMIN' as Role, 'ADMIN')).toBe(true);
  });

  it('MANAGER can do USER and MANAGER things but not ADMIN', () => {
    expect(can('MANAGER' as Role, 'USER')).toBe(true);
    expect(can('MANAGER' as Role, 'MANAGER')).toBe(true);
    expect(can('MANAGER' as Role, 'ADMIN')).toBe(false);
  });

  it('USER can only do USER things', () => {
    expect(can('USER' as Role, 'USER')).toBe(true);
    expect(can('USER' as Role, 'MANAGER')).toBe(false);
    expect(can('USER' as Role, 'ADMIN')).toBe(false);
  });

  it('undefined role has no permissions', () => {
    expect(can(undefined, 'USER')).toBe(false);
  });

  it('ROLE_HIERARCHY has 3 roles in correct order', () => {
    expect(ROLE_HIERARCHY).toEqual(['USER', 'MANAGER', 'ADMIN']);
  });
});
