/**
 * GET /api/currencies — List all active currencies
 */
import { NextResponse } from 'next/server';
import { getActiveCurrencies } from '@/lib/currency';

export async function GET() {
  const currencies = await getActiveCurrencies();
  return NextResponse.json({ items: currencies });
}
