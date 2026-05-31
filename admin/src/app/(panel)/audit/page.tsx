'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  ScrollText,
  User2,
} from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { StatCard } from '@/components/admin/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { auditApi, type AuditEvent } from '@/lib/admin-api';
import { formatRelative, cn } from '@/lib/utils';

const ACTION_TONE: Record<string, string> = {
  'user.update': 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  'user.delete': 'bg-destructive/15 text-destructive',
  'user.suspend': 'bg-destructive/15 text-destructive',
  'user.unsuspend': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  'user.role.promote': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  'user.role.demote': 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  'moderation.approve': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  'moderation.hide': 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  'moderation.unhide': 'bg-primary/15 text-primary',
  'moderation.remove': 'bg-destructive/15 text-destructive',
  'defaults.update': 'bg-primary/15 text-primary',
};

export default function AuditLogPage() {
  const t = useTranslations('Audit');
  const tCommon = useTranslations('Common');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const summary = useQuery({
    queryKey: ['admin', 'audit', 'summary'],
    queryFn: () => auditApi.summary(30),
  });
  const actions = useQuery({
    queryKey: ['admin', 'audit', 'actions'],
    queryFn: auditApi.actions,
  });
  const list = useQuery({
    queryKey: ['admin', 'audit', 'list', page, search, actionFilter, from, to],
    queryFn: () =>
      auditApi.list({
        page,
        limit: 25,
        search: search || undefined,
        action: actionFilter || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
  });

  const topAction = useMemo(
    () => summary.data?.byAction[0]?.action ?? '—',
    [summary.data],
  );

  return (
    <>
      <PageHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => list.refetch()}
            disabled={list.isFetching}
            className="gap-1.5"
          >
            {list.isFetching ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            {tCommon('refresh')}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={ScrollText}
          label={t('events30d')}
          value={summary.data?.total ?? '—'}
          sublabel={t('acrossActions')}
          tone="primary"
        />
        <StatCard
          icon={Filter}
          label={t('mostFrequent')}
          value={topAction}
          sublabel={t('mostFrequentSub', { n: summary.data?.byAction[0]?.count ?? 0 })}
          tone="accent"
        />
        <StatCard
          icon={User2}
          label={t('topActor')}
          value={summary.data?.byActor[0]?.name ?? '—'}
          sublabel={summary.data?.byActor[0]?.email ?? '—'}
          tone="tertiary"
        />
      </div>

      <Card>
        <CardContent className="grid gap-3 p-5 md:grid-cols-[1fr_220px_180px_180px_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="audit-search" className="text-xs">
              {tCommon('search')}
            </Label>
            <Input
              id="audit-search"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('actionLabel')}</Label>
            <Select
              value={actionFilter || '__all__'}
              onValueChange={(v) => {
                setActionFilter(v === '__all__' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('allActions')}</SelectItem>
                {(actions.data ?? []).map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audit-from" className="text-xs">
              {tCommon('from')}
            </Label>
            <Input
              id="audit-from"
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audit-to" className="text-xs">
              {tCommon('to')}
            </Label>
            <Input
              id="audit-to"
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              disabled={!search && !actionFilter && !from && !to}
              onClick={() => {
                setSearch('');
                setActionFilter('');
                setFrom('');
                setTo('');
                setPage(1);
              }}
            >
              {tCommon('clear')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 text-primary" />
            {t('events')}
          </CardTitle>
          {list.data && (
            <Badge variant="outline" className="tabular-nums">
              {list.data.meta.total}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {list.isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t('loadingLog')}
            </div>
          )}

          {list.data && list.data.items.length === 0 && (
            <div className="grid place-items-center rounded-xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
              <FileText className="mb-3 size-8 text-muted-foreground/40" />
              <p className="font-medium">{t('noEvents')}</p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                {t('noEventsHint')}
              </p>
            </div>
          )}

          {list.data && list.data.items.length > 0 && (
            <ul className="space-y-2">
              {list.data.items.map((evt) => (
                <AuditRow key={evt.id} evt={evt} />
              ))}
            </ul>
          )}

          {list.data && list.data.meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
              <span>
                {tCommon('page')} {list.data.meta.page} {tCommon('of')} {list.data.meta.totalPages} ·{' '}
                {list.data.meta.total} {tCommon('events')}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label={tCommon('previous')}
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) =>
                      Math.min(list.data?.meta.totalPages ?? 1, p + 1),
                    )
                  }
                  disabled={page >= list.data.meta.totalPages}
                  aria-label={tCommon('next')}
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function AuditRow({ evt }: { evt: AuditEvent }) {
  const tone = ACTION_TONE[evt.action] ?? 'bg-muted text-muted-foreground';
  const diffEntries = evt.diff ? Object.entries(evt.diff) : [];

  return (
    <li className="rounded-xl border border-border/60 bg-card p-3">
      <div className="flex flex-wrap items-start gap-3">
        <Avatar src={undefined} name={evt.actor.name} size={32} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{evt.actor.name}</span>
            <span className="text-[11px] text-muted-foreground">
              {evt.actor.email}
            </span>
            <span aria-hidden>·</span>
            <span
              className={cn(
                'rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold',
                tone,
              )}
            >
              {evt.action}
            </span>
            {evt.target?.label && (
              <Badge variant="outline" className="text-[10px]">
                → {evt.target.label}
              </Badge>
            )}
          </div>
          {evt.reason && (
            <p className="mt-1 text-xs text-muted-foreground">
              &ldquo;{evt.reason}&rdquo;
            </p>
          )}
          {diffEntries.length > 0 && (
            <ul className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
              {diffEntries.map(([k, v]) => {
                const obj = v as { from?: unknown; to?: unknown } | unknown;
                if (
                  obj &&
                  typeof obj === 'object' &&
                  'from' in obj &&
                  'to' in obj
                ) {
                  const o = obj as { from: unknown; to: unknown };
                  return (
                    <span
                      key={k}
                      className="rounded border border-border/40 bg-muted/30 px-1.5 py-0.5 font-mono"
                    >
                      <span className="text-muted-foreground">{k}: </span>
                      <span className="line-through opacity-60">
                        {String(o.from)}
                      </span>
                      <span className="mx-1 text-muted-foreground">→</span>
                      <span>{String(o.to)}</span>
                    </span>
                  );
                }
                return (
                  <span
                    key={k}
                    className="rounded border border-border/40 bg-muted/30 px-1.5 py-0.5 font-mono"
                  >
                    <span className="text-muted-foreground">{k}: </span>
                    <span>{JSON.stringify(v)}</span>
                  </span>
                );
              })}
            </ul>
          )}
          <p className="mt-1 text-[11px] text-muted-foreground">
            {formatRelative(evt.createdAt)}
            {evt.actor.ip && (
              <>
                {' · '}
                <span className="font-mono">{evt.actor.ip}</span>
              </>
            )}
          </p>
        </div>
      </div>
    </li>
  );
}
