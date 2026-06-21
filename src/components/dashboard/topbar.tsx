'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bell, Search, Sun, Moon, Menu, Languages } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Bell as BellIcon,
  Settings,
  BarChart3,
  ShieldAlert,
  LogOut,
  BookOpen,
  Award,
  Presentation,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

export function DashboardTopbar() {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const qc = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: unread } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?count=unread');
      if (!res.ok) return 0;
      const data = await res.json();
      return data.count ?? 0;
    },
    refetchInterval: 30_000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await fetch('/api/notifications', { method: 'PATCH' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  function toggleLocale() {
    const newLocale = locale === 'ar' ? 'en' : 'ar';
    if (pathname) {
      // Strip current locale prefix
      const stripped = pathname.replace(/^\/(ar|en)/, '') || '/';
      // Always include the new locale prefix (localePrefix: 'always')
      const next = `/${newLocale}${stripped === '/' ? '' : stripped}`;
      router.push(next);
    }
  }

  const NAV = [
    { href: '/dashboard', label: t('dashboard.overview'), icon: LayoutDashboard },
    { href: '/dashboard/my-courses', label: t('dashboard.myCourses'), icon: BookOpen },
    { href: '/dashboard/certificates', label: t('dashboard.certificates'), icon: Award },
    ...(session?.user?.role === 'TEACHER' || session?.user?.role === 'ADMIN'
      ? [{ href: '/teach', label: t('dashboard.teach'), icon: Presentation }]
      : []),
    ...(session?.user?.role === 'ADMIN'
      ? [
          { href: '/dashboard/users', label: t('dashboard.users'), icon: Users },
          { href: '/dashboard/payments', label: t('dashboard.payments'), icon: CreditCard },
          { href: '/dashboard/audit', label: t('dashboard.auditLog'), icon: ShieldAlert },
          { href: '/dashboard/settings', label: t('dashboard.settings'), icon: Settings },
        ]
      : []),
    { href: '/dashboard/notifications', label: t('dashboard.notifications'), icon: BellIcon },
  ];

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="flex h-full items-center gap-3 px-4">
        {/* Mobile sidebar trigger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side={isRtl ? 'right' : 'left'} className="w-72 p-0">
            <nav className="space-y-1 p-4">
              {NAV.map((item) => {
                const Icon = item.icon;
                const href = isRtl ? `/ar${item.href}` : item.href;
                return (
                  <Link
                    key={item.href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm',
                      pathname === href ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
              >
                <LogOut className="h-4 w-4" />
                {t('auth.logout')}
              </button>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            className="ps-9 h-9"
            type="search"
          />
        </div>

        <div className="flex items-center gap-1.5 ms-auto">
          {/* Locale switcher */}
          <Button variant="ghost" size="icon" onClick={toggleLocale} aria-label="switch language">
            <Languages className="h-4 w-4" />
            <span className="text-xs ms-1 hidden sm:inline">{locale === 'ar' ? 'EN' : 'ع'}</span>
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="toggle theme"
          >
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="h-4 w-4 hidden dark:block" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="notifications">
                <Bell className="h-4 w-4" />
                {unread && unread > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -end-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
                  >
                    {unread > 9 ? '9+' : unread}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-sm font-semibold">{t('notifications.title')}</span>
                {unread && unread > 0 ? (
                  <button
                    className="text-xs text-primary hover:underline"
                    onClick={() => markAllReadMutation.mutate()}
                  >
                    {t('notifications.markAllRead')}
                  </button>
                ) : null}
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                <NotificationList />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/notifications" className="justify-center text-primary">
                  {t('common.view')} {t('notifications.title')}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <span className="hidden sm:inline text-sm">
                  {session?.user?.name || session?.user?.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">{t('settings.title')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-destructive focus:text-destructive"
              >
                {t('auth.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function NotificationList() {
  const { data } = useQuery({
    queryKey: ['notifications', 'dropdown'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?limit=5');
      if (!res.ok) return [];
      const data = await res.json();
      return data.items ?? [];
    },
    staleTime: 30_000,
  });

  if (!data || data.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        No notifications
      </div>
    );
  }

  return (
    <>
      {data.map((n: { id: string; title: string; body: string; createdAt: string; status: string }) => (
        <DropdownMenuItem key={n.id} className="flex-col items-start py-2">
          <div className="flex w-full items-start gap-2">
            {!n.status || n.status !== 'READ' ? (
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            ) : (
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-transparent shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{n.title}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
            </div>
          </div>
        </DropdownMenuItem>
      ))}
    </>
  );
}
