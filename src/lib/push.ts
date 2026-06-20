/**
 * Push Service — Firebase Cloud Messaging (FCM)
 * Falls back gracefully when Firebase env vars are not configured.
 */
import admin, { type Message } from 'firebase-admin';
import { logger } from '@/lib/logger';

let initialized = false;

function init(): boolean {
  if (initialized) return true;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    return false;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    initialized = true;
    return true;
  } catch (err) {
    logger.error({ err }, 'Firebase init failed');
    return false;
  }
}

interface SendPushInput {
  tokens: string[];
  title: string;
  body: string;
  link?: string;
  data?: Record<string, string>;
}

export async function sendPush(input: SendPushInput) {
  if (!init()) {
    logger.warn(
      { tokens: input.tokens.length, title: input.title },
      'Firebase not configured — skipping push (dev mode)',
    );
    return { successCount: 0, failureCount: 0 };
  }

  const message: Message = {
    notification: { title: input.title, body: input.body },
    data: {
      ...(input.data ?? {}),
      ...(input.link ? { link: input.link } : {}),
    },
    tokens: input.tokens,
  };

  const response = await admin.messaging().sendEachForMulticast(message);
  logger.info(
    { successCount: response.successCount, failureCount: response.failureCount },
    'Push sent',
  );
  return response;
}
