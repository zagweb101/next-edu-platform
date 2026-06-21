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
  LogOut,
  ChevronLeft,
  ChevronRight,
  Code2,
  ShieldAlert,
  GraduationCap,
  BookOpen,
  Award,
  Presentation,
  Radio,
  MessageSquare,
  Ticket,
  DollarSign,
  Globe,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { can, hasRole } from '@/lib/rbac';
import type { Role } from '@prisma/client';

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  /** Minimum role required (hierarchy-based check) */
  requiredRole?: Role;
  /** OR: specific allowed roles */
  allowedRoles?: Role[];
}

// Education platform navigation items
const NAV_ITEMS: NavItem[] = [
  // Common
  { href: '/dashboard', labelKey: 'dashboard.overview', icon: LayoutDashboard },

  // Student items
  { href: '/dashboard/my-courses', labelKey: 'dashboard.myCourses', icon: BookOpen, allowedRoles: ['STUDENT', 'TEACHER', 'ADMIN'] },
  { href: '/dashboard/certificates', labelKey: 'dashboard.certificates', icon: Award, allowedRoles: ['STUDENT', 'TEACHER', 'ADMIN'] },

  // Community items (NEW)
  { href: '/live', labelKey: 'dashboard.live', icon: Radio },
  { href: '/forum', labelKey: 'dashboard.forum', icon: MessageSquare },
  { href: '/dashboard/messages', labelKey: 'dashboard.messages', icon: MessageSquare },

  // Teacher items
  { href: '/teach', labelKey: 'dashboard.teach', icon: Presentation, allowedRoles: ['TEACHER', 'ADMIN'] },

  // Affiliate (NEW)
  { href: '/dashboard/affiliate', labelKey: 'dashboard.affiliate', icon: DollarSign },

  // Admin items
  { href: '/dashboard/analytics', labelKey: 'dashboard.analytics', icon: BarChart3, allowedRoles: ['TEACHER', 'ADMIN'] },
  { href: '/dashboard/users', labelKey: 'dashboard.users', icon: Users, allowedRoles: ['ADMIN'] },
  { href: '/dashboard/payments', labelKey: 'dashboard.payments', icon: CreditCard, allowedRoles: ['ADMIN'] },
  { href: '/dashboard/coupons', labelKey: 'dashboard.coupons', icon: Ticket, allowedRoles: ['ADMIN'] },
  { href: '/dashboard/notifications', labelKey: 'dashboard.notifications', icon: Bell },
  { href: '/dashboard/audit', labelKey: 'dashboard.auditLog', icon: ShieldAlert, allowedRoles: ['ADMIN'] },
  { href: '/dashboard/settings', labelKey: 'dashboard.settings', icon: Settings, allowedRoles: ['ADMIN'] },
];

export function DashboardSidebar() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { data: session } = useSession();
  const isRtl = locale === 'ar';
  const [collapsed, setCollapsed] = useState(false);

  const user = session?.user;
  const userRole = (user?.role as Role | undefined) ?? 'STUDENT';

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.allowedRoles) {
      return hasRole(userRole, item.allowedRoles);
    }
    if (item.requiredRole) {
      return can(userRole, item.requiredRole);
    }
    return true;
  });

  // Group items by role context
  const studentItems = visibleItems.filter(i =>
    ['/dashboard', '/dashboard/my-courses', '/dashboard/certificates'].includes(i.href)
  );
  const communityItems = visibleItems.filter(i =>
    ['/live', '/forum', '/dashboard/messages'].includes(i.href)
  );
  const teacherItems = visibleItems.filter(i => i.href.startsWith('/teach'));
  const affiliateItems = visibleItems.filter(i => i.href === '/dashboard/affiliate');
  const adminItems = visibleItems.filter(i =>
    ['/dashboard/analytics', '/dashboard/users', '/dashboard/payments', '/dashboard/coupons', '/dashboard/notifications', '/dashboard/audit', '/dashboard/settings'].includes(i.href)
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
            <GraduationCap className="h-5 w-5" />
            <span>{process.env.NEXT_PUBLIC_APP_NAME || 'منصة تعلّم'}</span>
          </Link>
        )}
        {collapsed && <GraduationCap className="h-5 w-5 mx-auto" />}
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
        <nav className="space-y-4">
          {/* Student section */}
          {studentItems.length > 0 && (
            <NavSection
              title={locale === 'ar' ? 'التعلم' : 'Learning'}
              items={studentItems}
              pathname={pathname}
              isRtl={isRtl}
              collapsed={collapsed}
              t={t}
            />
          )}

          {/* Community section (NEW) */}
          {communityItems.length > 0 && (
            <NavSection
              title={locale === 'ar' ? 'المجتمع' : 'Community'}
              items={communityItems}
              pathname={pathname}
              isRtl={isRtl}
              collapsed={collapsed}
              t={t}
            />
          )}

          {/* Teacher section */}
          {teacherItems.length > 0 && (
            <NavSection
              title={locale === 'ar' ? 'التدريس' : 'Teaching'}
              items={teacherItems}
              pathname={pathname}
              isRtl={isRtl}
              collapsed={collapsed}
              t={t}
            />
          )}

          {/* Affiliate section (NEW) */}
          {affiliateItems.length > 0 && (
            <NavSection
              title={locale === 'ar' ? 'العمولة' : 'Affiliate'}
              items={affiliateItems}
              pathname={pathname}
              isRtl={isRtl}
              collapsed={collapsed}
              t={t}
            />
          )}

          {/* Admin section */}
          {adminItems.length > 0 && (
            <NavSection
              title={locale === 'ar' ? 'الإدارة' : 'Administration'}
              items={adminItems}
              pathname={pathname}
              isRtl={isRtl}
              collapsed={collapsed}
              t={t}
            />
          )}
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

function NavSection({
  title,
  items,
  pathname,
  isRtl,
  collapsed,
  t,
}: {
  title: string;
  items: NavItem[];
  pathname: string | null;
  isRtl: boolean;
  collapsed: boolean;
  t: any;
}) {
  return (
    <div>
      {!collapsed && (
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
          {title}
        </p>
      )}
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const href = isRtl ? `/ar${item.href}` : item.href;
          const isActive =
            pathname === href ||
            (pathname?.startsWith(href + '/') && item.href !== '/dashboard' && item.href !== '/teach');
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
      </div>
    </div>
  );
}
