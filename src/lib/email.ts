/**
 * Email Service — Resend + React Email templates
 * Falls back to logging when RESEND_API_KEY is not configured.
 */
import { Resend } from 'resend';
import { logger } from '@/lib/logger';
import { NotificationEmail } from '@/lib/email-templates/notification';
import { WelcomeEmail } from '@/lib/email-templates/welcome';

interface SendEmailInput {
  to: string;
  subject: string;
  title: string;
  body: string;
  link?: string;
  userName?: string;
  locale?: string;
  template?: 'notification' | 'welcome' | 'reset-password' | 'verify-email';
}

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

export async function sendEmail(input: SendEmailInput) {
  const from = process.env.EMAIL_FROM || 'Boilerplate <noreply@example.com>';
  const c = getClient();

  if (!c) {
    logger.warn(
      { to: input.to, subject: input.subject },
      'RESEND_API_KEY not set — skipping email (dev mode)',
    );
    return { id: 'dev-mode-no-send' };
  }

  const template = input.template ?? 'notification';
  const react =
    template === 'welcome'
      ? WelcomeEmail({ userName: input.userName, locale: input.locale })
      : NotificationEmail({
          title: input.title,
          body: input.body,
          link: input.link,
          userName: input.userName,
          locale: input.locale,
        });

  const { data, error } = await c.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    react,
  });

  if (error) {
    logger.error({ error, to: input.to }, 'Resend email failed');
    throw error;
  }

  logger.info({ id: data?.id, to: input.to }, 'Email sent');
  return data;
}
