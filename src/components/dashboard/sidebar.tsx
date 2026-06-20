'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Bell,
  Settings,
  BarChart3,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Code2,
  ShieldAlert,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { can } from '@/lib/rbac';

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  requiredRole?: 'ADMIN' | 'MANAGER' | 'USER';
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', labelKey: 'dashboard.overview', icon: LayoutDashboard },
  { href: '/dashboard/analytics', labelKey: 'dashboard.analytics', icon: BarChart3, requiredRole: 'MANAGER' },
  { href: '/dashboard/users', labelKey: 'dashboard.users', icon: Users, requiredRole: 'MANAGER' },
  { href: '/dashboard/payments', labelKey: 'dashboard.payments', icon: CreditCard, requiredRole: 'MANAGER' },
  { href: '/dashboard/notifications', labelKey: 'dashboard.notifications', icon: Bell },
  { href: '/dashboard/audit', labelKey: 'dashboard.auditLog', icon: ShieldAlert, requiredRole: 'ADMIN' },
  { href: '/dashboard/settings', labelKey: 'dashboard.settings', icon: Settings, requiredRole: 'ADMIN' },
];

export function DashboardSidebar() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { data: session } = useSession();
  const isRtl = locale === 'ar';
  const [collapsed, setCollapsed] = useState(false);

  const user = session?.user;
  const userRole = (user?.role as 'ADMIN' | 'MANAGER' | 'USER' | undefined) ?? 'USER';

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.requiredRole || can(userRole, item.requiredRole),
  );

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 font-bold">
            <Code2 className="h-5 w-5" />
            <span>{process.env.NEXT_PUBLIC_APP_NAME || 'Boilerplate'}</span>
          </Link>
        )}
        {collapsed && <Code2 className="h-5 w-5 mx-auto" />}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="toggle sidebar"
        >
          {isRtl ? (
            collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
          ) : (
            collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Nav items */}
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const href = isRtl ? `/ar${item.href}` : item.href;
            // Match either exactly the path, or path + subpath
            const isActive =
              pathname === href ||
              (pathname?.startsWith(href + '/') && item.href !== '/dashboard');
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  collapsed && 'justify-center',
                )}
                title={collapsed ? t(item.labelKey) : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{t(item.labelKey)}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User card */}
      <div className="border-t p-3">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <Avatar className="h-9 w-9">
            <AvatarFallback>
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || user?.email}</p>
              <p className="text-xs text-muted-foreground">{t(`roles.${userRole}`)}</p>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => signOut({ callbackUrl: '/' })}
              aria-label={t('auth.logout')}
              title={t('auth.logout')}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
