/**
 * POST /api/auth/register
 * Create a new user with email/password.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { audit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email';

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'INVALID_INPUT', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { name, email, password } = parsed.data;

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'EMAIL_ALREADY_REGISTERED' },
        { status: 409 },
      );
    }

    // Hash password and create user
    const hashed = await hashPassword(password);
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: 'USER',
      },
      select: { id: true, email: true, name: true },
    });

    await audit.log({
      userId: user.id,
      action: 'user.register',
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    });
    logger.info({ userId: user.id, email: user.email }, 'User registered');

    // Send welcome email (non-blocking, fails silently)
    sendEmail({
      to: user.email,
      subject: 'Welcome aboard!',
      title: 'Welcome!',
      body: `Hi ${name}, your account has been created successfully.`,
      userName: name,
      template: 'welcome',
    }).catch((err) => {
      logger.error({ err, userId: user.id }, 'Welcome email failed');
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    logger.error({ err }, 'Register handler failed');
    return NextResponse.json(
      { error: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
