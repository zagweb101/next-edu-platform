/**
 * Currency conversion utilities
 * Base currency: SAR (Saudi Riyal)
 *
 * All prices in DB are stored in SAR. This module converts to the user's
 * preferred currency for display purposes.
 */
import { db } from '@/lib/db';

export const BASE_CURRENCY = 'SAR';

// In-memory cache for currencies (refreshed every 5 minutes)
let currencyCache: Map<string, { rate: number; symbol: string; name: string }> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadCurrencies() {
  if (currencyCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return currencyCache;
  }

  const currencies = await db.currency.findMany({
    where: { isActive: true },
  });

  const cache = new Map<string, { rate: number; symbol: string; name: string }>();
  for (const c of currencies) {
    cache.set(c.code, { rate: c.exchangeRate, symbol: c.symbol, name: c.name });
  }

  // Ensure SAR is always there
  if (!cache.has(BASE_CURRENCY)) {
    cache.set(BASE_CURRENCY, { rate: 1, symbol: 'ر.س', name: 'ريال سعودي' });
  }

  currencyCache = cache;
  cacheTimestamp = Date.now();
  return cache;
}

/**
 * Convert an amount from SAR to the target currency
 */
export async function convertFromSar(amount: number, toCurrency: string): Promise<number> {
  if (toCurrency === BASE_CURRENCY) return amount;
  const cache = await loadCurrencies();
  const target = cache.get(toCurrency);
  if (!target) return amount; // fallback to SAR
  return amount * target.rate;
}

/**
 * Format an amount in the target currency
 */
export async function formatInCurrency(
  amountInSar: number,
  currency: string,
  locale: string = 'ar',
): Promise<string> {
  const converted = await convertFromSar(amountInSar, currency);
  const cache = await loadCurrencies();
  const cur = cache.get(currency);

  if (currency === 'SAR') {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 2,
    }).format(converted);
  }

  const symbol = cur?.symbol || currency;
  const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    maximumFractionDigits: 2,
  }).format(converted);

  return `${formatted} ${symbol}`;
}

/**
 * Get all active currencies for the selector
 */
export async function getActiveCurrencies() {
  const cache = await loadCurrencies();
  return Array.from(cache.entries()).map(([code, val]) => ({
    code,
    name: val.name,
    symbol: val.symbol,
    rate: val.rate,
  }));
}

/**
 * Get a cookie-stored user currency preference (server-side).
 * Falls back to SAR if not set.
 */
export function getUserCurrency(cookieHeader?: string | null): string {
  if (!cookieHeader) return BASE_CURRENCY;
  const match = cookieHeader.match(/(?:^|;\s*)preferred_currency=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : BASE_CURRENCY;
}
