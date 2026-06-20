/**
 * NextAuth v5 configuration
 * Docs: https://authjs.dev
 *
 * Providers:
 *   - Credentials (email/password)
 *   - Google OAuth
 *   - GitHub OAuth
 *
 * Features:
 *   - JWT sessions (stateless, works on serverless)
 *   - Prisma adapter for persistence
 *   - Role-based access control (RBAC) via `user.role`
 *   - Audit log on sign in
 *   - Last login tracking
 */
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { audit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import type { Role } from '@prisma/client';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  providers: [
    Credentials({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }
        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user || !user.password || !user.isActive) {
          logger.warn({ email }, 'Login failed: user not found or inactive');
          return null;
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          logger.warn({ email, userId: user.id }, 'Login failed: bad password');
          return null;
        }

        // Update last login + audit
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
        await audit.log({
          userId: user.id,
          action: 'user.login',
          ipAddress: req?.headers?.get?.('x-forwarded-for') ?? undefined,
          userAgent: req?.headers?.get?.('user-agent') ?? undefined,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Initial sign-in: persist role + id on the token
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role ?? 'USER';
      }
      // Refresh: re-read role from DB to pick up changes
      if (trigger === 'update' && token.id) {
        const u = await db.user.findUnique({
          where: { id: token.id },
          select: { role: true, name: true, image: true, isActive: true },
        });
        if (!u || !u.isActive) {
          // Force sign-out
          return {} as typeof token;
        }
        token.role = u.role;
        token.name = u.name;
        token.picture = u.image ?? undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider !== 'credentials') {
        // For OAuth providers, audit the login
        await audit.log({
          userId: user.id,
          action: 'user.login',
          metadata: { provider: account?.provider },
        });
      }
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      await audit.log({
        userId: user.id,
        action: 'user.register',
      });
      logger.info({ userId: user.id, email: user.email }, 'New user registered');
    },
  },
  logger: {
    error: (code, ...args) => logger.error({ code, args }, 'NextAuth error'),
    warn: (code, ...args) => logger.warn({ code, args }, 'NextAuth warning'),
    debug: (code, ...args) => logger.debug({ code, args }, 'NextAuth debug'),
  },
});
