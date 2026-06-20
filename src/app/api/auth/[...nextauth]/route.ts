/**
 * NextAuth v5 route handlers
 * Mounts at /api/auth/*
 */
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
