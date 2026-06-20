'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, Loader2 } from 'lucide-react';
import type { Role } from '@prisma/client';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  image: string | null;
}

export function UsersTable({ users: initial, canEdit }: { users: User[]; canEdit: boolean }) {
  const t = useTranslations();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');

  const filtered = initial.filter((u) => {
    const matchesSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: string; role?: Role; isActive?: boolean }) => {
      const { id, ...body } = data;
      const res = await fetch(`/api/users?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('User updated');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => toast.error('Failed to update user'),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('users.title')}</CardTitle>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('users.searchUsers')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as 'ALL' | Role)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('users.filterByRole')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('common.all')}</SelectItem>
              <SelectItem value="ADMIN">{t('roles.ADMIN')}</SelectItem>
              <SelectItem value="MANAGER">{t('roles.MANAGER')}</SelectItem>
              <SelectItem value="USER">{t('roles.USER')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-start py-2 px-3 font-medium">{t('users.name')}</th>
                <th className="text-start py-2 px-3 font-medium hidden md:table-cell">{t('users.role')}</th>
                <th className="text-start py-2 px-3 font-medium hidden sm:table-cell">{t('users.status')}</th>
                <th className="text-start py-2 px-3 font-medium hidden lg:table-cell">{t('users.lastLogin')}</th>
                {canEdit && <th className="text-end py-2 px-3 font-medium">{t('common.actions')}</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t('users.noUsers')}
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-t hover:bg-muted/30">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{u.name?.[0] || u.email[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{u.name || '—'}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3 hidden md:table-cell">
                      {canEdit ? (
                        <Select
                          value={u.role}
                          onValueChange={(v) =>
                            updateUserMutation.mutate({ id: u.id, role: v as Role })
                          }
                          disabled={updateUserMutation.isPending}
                        >
                          <SelectTrigger className="w-[120px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">{t('roles.ADMIN')}</SelectItem>
                            <SelectItem value="MANAGER">{t('roles.MANAGER')}</SelectItem>
                            <SelectItem value="USER">{t('roles.USER')}</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline">{t(`roles.${u.role}`)}</Badge>
                      )}
                    </td>
                    <td className="py-2 px-3 hidden sm:table-cell">
                      {canEdit ? (
                        <Switch
                          checked={u.isActive}
                          onCheckedChange={(v) =>
                            updateUserMutation.mutate({ id: u.id, isActive: v })
                          }
                          disabled={updateUserMutation.isPending}
                        />
                      ) : (
                        <Badge variant={u.isActive ? 'default' : 'secondary'}>
                          {u.isActive ? t('users.active') : t('users.inactive')}
                        </Badge>
                      )}
                    </td>
                    <td className="py-2 px-3 text-xs text-muted-foreground hidden lg:table-cell">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}
                    </td>
                    {canEdit && (
                      <td className="py-2 px-3 text-end">
                        {updateUserMutation.isPending && (
                          <Loader2 className="h-4 w-4 animate-spin inline" />
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
