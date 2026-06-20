/**
 * Moyasar Webhook Handler
 * Docs: https://docs.moyasar.com/webhooks
 *
 * Moyasar sends a POST with the payment object on every status change.
 * Verify the signature, then sync the payment in DB.
 */
import { NextRequest, NextResponse } from 'next/server';
import { moyasar } from '@/lib/payments/moyasar';
import { logger } from '@/lib/logger';
import { notify } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('moyasar-signature') ?? '';

  // Verify webhook signature (skip in dev if not configured)
  if (process.env.MOYASAR_WEBHOOK_SECRET) {
    if (!moyasar.verifyWebhookSignature(rawBody, signature)) {
      logger.warn({ signature }, 'Moyasar webhook: invalid signature');
      return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 401 });
    }
  } else {
    logger.warn('MOYASAR_WEBHOOK_SECRET not set — skipping signature verification');
  }

  let payload: { id?: string; status?: string; amount?: number; metadata?: { userId?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  if (!payload.id) {
    return NextResponse.json({ error: 'MISSING_PAYMENT_ID' }, { status: 400 });
  }

  try {
    const payment = await moyasar.fetchAndUpdate(payload.id);

    // Notify user on successful payment
    if (payment.status === 'PAID') {
      await notify.send({
        userId: payment.userId,
        title: 'Payment successful',
        body: `Your payment of ${payment.amount} ${payment.currency} has been received.`,
        type: 'success',
        link: '/dashboard/payments',
      });
    } else if (payment.status === 'FAILED') {
      await notify.send({
        userId: payment.userId,
        title: 'Payment failed',
        body: `Your payment of ${payment.amount} ${payment.currency} failed. Please try again.`,
        type: 'error',
        link: '/dashboard/payments',
      });
    }

    logger.info({ moyasarId: payload.id, status: payment.status }, 'Webhook processed');
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error({ err, moyasarId: payload.id }, 'Webhook handler failed');
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
