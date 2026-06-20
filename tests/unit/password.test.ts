/**
 * Unit test — password helpers
 */
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/password';

describe('password helpers', () => {
  it('hashes a password and verifies it', async () => {
    const plain = 'mySecretPassword123';
    const hashed = await hashPassword(plain);
    expect(hashed).not.toBe(plain);
    expect(hashed.length).toBeGreaterThan(40);
    expect(await verifyPassword(plain, hashed)).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hashed = await hashPassword('correctPassword');
    expect(await verifyPassword('wrongPassword', hashed)).toBe(false);
  });
});
