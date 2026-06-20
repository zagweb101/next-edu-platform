/**
 * Users management page — admin/manager only
 */
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/rbac';
import { UsersTable } from '@/components/dashboard/users-table';

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale ?? 'ar');
  const session = await requireRole('MANAGER');
  await getTranslations();

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      image: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {session.user.role === 'ADMIN' ? 'User Management' : 'Users'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage user accounts, roles, and permissions
        </p>
      </div>
      <UsersTable users={users} canEdit={session.user.role === 'ADMIN'} />
    </div>
  );
}
