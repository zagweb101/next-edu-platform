/**
 * Unit test — format helpers
 */
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatNumber, formatDate } from '@/lib/format';

describe('format helpers', () => {
  it('formats currency in SAR', () => {
    const formatted = formatCurrency(100, 'en-US', 'SAR');
    expect(formatted).toContain('100');
    expect(formatted).toContain('SAR');
  });

  it('formats currency in Arabic locale', () => {
    const formatted = formatCurrency(99.99, 'ar-SA', 'SAR');
    // Arabic currency formatting uses Arabic-Indic digits
    expect(formatted).toBeTruthy();
  });

  it('formats numbers', () => {
    expect(formatNumber(1234567, 'en-US')).toBe('1,234,567');
  });

  it('formats dates in English', () => {
    const d = new Date('2024-01-15T10:30:00Z');
    const formatted = formatDate(d, 'en');
    expect(formatted).toBeTruthy();
    expect(formatted.length).toBeGreaterThan(5);
  });

  it('formats dates in Arabic', () => {
    const d = new Date('2024-01-15T10:30:00Z');
    const formatted = formatDate(d, 'ar');
    expect(formatted).toBeTruthy();
    expect(formatted.length).toBeGreaterThan(5);
  });
});
