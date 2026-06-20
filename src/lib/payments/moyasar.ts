/**
 * Moyasar Payment Service — Saudi payment gateway
 * Docs: https://docs.moyasar.com
 *
 * Supports:
 *   - Credit Card (Visa, Mastercard, Mada)
 *   - Apple Pay
 *   - STC Pay
 *
 * Usage:
 *   import { moyasar } from '@/lib/payments/moyasar';
 *   const payment = await moyasar.createPayment({
 *     amount: 100, // SAR
 *     description: 'Pro plan subscription',
 *     callbackUrl: 'https://example.com/dashboard/billing',
 *   });
 */
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { audit } from '@/lib/audit';
import crypto from 'node:crypto';
import type { PaymentMethod, PaymentStatus } from '@prisma/client';

const MOYASAR_API = 'https://api.moyasar.com/v1';
const SECRET_KEY = process.env.MOYASAR_SECRET_KEY;

interface CreatePaymentInput {
  userId: string;
  amount: number; // SAR (will be multiplied by 100 for halalas)
  currency?: string;
  description: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
  source?: {
    type: 'creditcard' | 'applepay' | 'stcpay';
    name?: string;
    number?: string;
    cvc?: string;
    month?: string;
    year?: string;
  };
}

interface MoyasarPaymentResponse {
  id: string;
  status: 'initiated' | 'in_progress' | 'authorized' | 'captured' | 'failed' | 'refunded';
  amount: number;
  currency: string;
  source: Record<string, unknown>;
  callback_url: string;
  description: string;
  metadata?: Record<string, unknown>;
  invoice_id?: string;
}

function authHeader() {
  return 'Basic ' + Buffer.from(SECRET_KEY + ':').toString('base64');
}

function toHalalas(amount: number): number {
  return Math.round(amount * 100);
}

function fromHalalas(halalas: number): number {
  return halalas / 100;
}

export const moyasar = {
  /**
   * Initiate a new payment. For credit card / apple pay, this returns
   * a payment object that the client should redirect to.
   */
  async createPayment(input: CreatePaymentInput) {
    if (!SECRET_KEY) {
      throw new Error('MOYASAR_SECRET_KEY is not configured');
    }

    const amountHalalas = toHalalas(input.amount);

    const body: Record<string, unknown> = {
      amount: amountHalalas,
      currency: input.currency ?? 'SAR',
      description: input.description,
      callback_url: input.callbackUrl,
      metadata: {
        userId: input.userId,
        ...input.metadata,
      },
    };

    if (input.source) {
      body.source = input.source;
    } else {
      // Default source: creditcard (redirect-based)
      body.source = { type: 'creditcard' };
    }

    const res = await fetch(`${MOYASAR_API}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader(),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error({ status: res.status, errText }, 'Moyasar createPayment failed');
      throw new Error(`Moyasar API error: ${res.status}`);
    }

    const data: MoyasarPaymentResponse = await res.json();

    // Persist in DB
    const payment = await db.payment.create({
      data: {
        userId: input.userId,
        moyasarId: data.id,
        amount: input.amount,
        currency: data.currency,
        status: this.mapStatus(data.status),
        description: input.description,
        source: data.source as object,
        metadata: input.metadata as object | undefined,
        invoiceId: data.invoice_id,
        callbackUrl: input.callbackUrl,
      },
    });

    await audit.log({
      userId: input.userId,
      action: 'payment.initiate',
      entity: 'Payment',
      entityId: payment.id,
      paymentId: payment.id,
      metadata: { amount: input.amount, moyasarId: data.id },
    });

    logger.info({ paymentId: payment.id, moyasarId: data.id }, 'Payment initiated');
    return { db: payment, moyasar: data };
  },

  /**
   * Fetch a payment from Moyasar by ID and sync our DB.
   */
  async fetchAndUpdate(moyasarId: string) {
    if (!SECRET_KEY) throw new Error('MOYASAR_SECRET_KEY is not configured');

    const res = await fetch(`${MOYASAR_API}/payments/${moyasarId}`, {
      headers: { Authorization: authHeader() },
    });
    if (!res.ok) {
      throw new Error(`Moyasar fetch error: ${res.status}`);
    }
    const data: MoyasarPaymentResponse = await res.json();

    const updated = await db.payment.update({
      where: { moyasarId },
      data: {
        status: this.mapStatus(data.status),
        source: data.source as object,
        metadata: data.metadata as object | undefined,
        invoiceId: data.invoice_id,
      },
    });

    if (this.mapStatus(data.status) === 'PAID') {
      await audit.log({
        userId: updated.userId,
        action: 'payment.succeed',
        entity: 'Payment',
        entityId: updated.id,
        paymentId: updated.id,
        metadata: { amount: updated.amount },
      });
    }

    return updated;
  },

  /**
   * Refund a payment (full or partial).
   */
  async refund(moyasarId: string, amount?: number) {
    if (!SECRET_KEY) throw new Error('MOYASAR_SECRET_KEY is not configured');

    const url = `${MOYASAR_API}/payments/${moyasarId}/refund`;
    const body = amount ? { amount: toHalalas(amount) } : {};

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader(),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      logger.error({ status: res.status, err }, 'Moyasar refund failed');
      throw new Error(`Refund failed: ${res.status}`);
    }

    const data: MoyasarPaymentResponse = await res.json();

    const updated = await db.payment.update({
      where: { moyasarId },
      data: {
        status: this.mapStatus(data.status),
        refundedAmount: amount ?? fromHalalas(data.amount),
      },
    });

    await audit.log({
      userId: updated.userId,
      action: 'payment.refund',
      entity: 'Payment',
      entityId: updated.id,
      paymentId: updated.id,
      metadata: { amount: amount ?? updated.amount },
    });

    return updated;
  },

  /**
   * Verify webhook signature — HMAC SHA256 using webhook secret.
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!process.env.MOYASAR_WEBHOOK_SECRET) return false;
    const expected = crypto
      .createHmac('sha256', process.env.MOYASAR_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
    return (
      expected.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
    );
  },

  /** Map Moyasar status to our PaymentStatus enum */
  mapStatus(s: string): PaymentStatus {
    switch (s) {
      case 'captured':
      case 'authorized':
        return 'PAID';
      case 'failed':
        return 'FAILED';
      case 'refunded':
        return 'REFUNDED';
      case 'initiated':
        return 'INITIATED';
      case 'in_progress':
        return 'PENDING';
      default:
        return 'PENDING';
    }
  },

  /** Map Moyasar source.type to our PaymentMethod enum */
  mapMethod(t: string): PaymentMethod | undefined {
    switch (t) {
      case 'creditcard':
        return 'CREDITCARD';
      case 'applepay':
        return 'APPLEPAY';
      case 'stcpay':
        return 'STCPAY';
      case 'mada':
        return 'MADA';
      default:
        return undefined;
    }
  },
};
