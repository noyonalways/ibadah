'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Loader2, UserCheck } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { activeUsersApi } from '@/lib/admin-api';
import { formatRelative } from '@/lib/utils';

const WINDOW_KEYS = ['1', '7', '30', '90'] as const;

const WINDOW_LABEL_KEYS: Record<(typeof WINDOW_KEYS)[number], 'last24h' | 'last7d' | 'last30d' | 'last90d'> = {
  '1': 'last24h',
  '7': 'last7d',
  '30': 'last30d',
  '90': 'last90d',
};

export default function ActiveUsersPage() {
  const t = useTranslations('Users');
  const tCommon = useTranslations('Common');
  const [days, setDays] = useState('7');
  const [limit, setLimit] = useState('50');

  const list = useQuery({
    queryKey: ['admin', 'active-users', days, limit],
    queryFn: () =>
      activeUsersApi.fetch({ days: parseInt(days, 10), limit: parseInt(limit, 10) }),
  });

  const currentWindow = WINDOW_LABEL_KEYS[days as keyof typeof WINDOW_LABEL_KEYS];

  return (
    <>
      <PageHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
      />

      <Card>
        <CardContent className="grid gap-3 p-5 md:grid-cols-[1fr_180px]">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('activityWindow')}</Label>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WINDOW_KEYS.map((w) => (
                  <SelectItem key={w} value={w}>
                    {t(WINDOW_LABEL_KEYS[w])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('showUpTo')}</Label>
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['20', '50', '100'].map((n) => (
                  <SelectItem key={n} value={n}>
                    {t('usersCount', { n })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="size-4 text-primary" />
            {currentWindow ? t(currentWindow) : ''}
          </CardTitle>
          {list.data && (
            <Badge variant="outline" className="tabular-nums">
              {list.data.length} {list.data.length === 1 ? tCommon('user') : tCommon('users')}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {list.isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {tCommon('loading')}
            </div>
          )}

          {list.data && list.data.length === 0 && (
            <div className="grid place-items-center rounded-xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
              <UserCheck className="mb-3 size-8 text-muted-foreground/40" />
              <p className="font-medium">{t('noActivity')}</p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                {t('noActivityHint')}
              </p>
            </div>
          )}

          {list.data && list.data.length > 0 && (
            <ul className="divide-y divide-border/50">
              {list.data.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <Avatar src={u.avatarUrl} name={u.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      {u.role === 'admin' && (
                        <Badge variant="success" className="text-[9px]">
                          {t('admin')}
                        </Badge>
                      )}
                      {u.suspended && (
                        <Badge variant="destructive" className="text-[9px]">
                          {t('suspended')}
                        </Badge>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium tabular-nums">
                      {formatRelative(u.lastActiveAt)}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {tCommon('lastSeen')}
                    </p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/users/${u.id}`}>{t('view')}</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
