'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  EyeOff,
  HandHeart,
  Loader2,
  ListChecks,
  ListTodo,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Undo2,
} from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { StatCard } from '@/components/admin/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  moderationApi,
  type ModerationFlag,
  type ModerationStatus,
  type ModerationTargetType,
} from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';
import { formatRelative, cn } from '@/lib/utils';

const TYPE_META: Record<
  ModerationTargetType,
  { label: string; icon: typeof ShieldCheck }
> = {
  habit: { label: 'Habit', icon: ListChecks },
  checklist_item: { label: 'Checklist item', icon: ListTodo },
  dhikr: { label: 'Dhikr', icon: HandHeart },
};

const STATUS_TONE: Record<
  ModerationStatus,
  'warning' | 'success' | 'destructive' | 'secondary'
> = {
  pending: 'warning',
  approved: 'success',
  hidden: 'secondary',
  removed: 'destructive',
};

export default function ModerationPage() {
  const t = useTranslations('Moderation');
  const qc = useQueryClient();
  const [status, setStatus] = useState<ModerationStatus | 'all'>('pending');
  const [typeFilter, setTypeFilter] = useState<ModerationTargetType | 'all'>('all');

  const overview = useQuery({
    queryKey: ['admin', 'moderation', 'overview'],
    queryFn: moderationApi.overview,
  });

  const queue = useQuery({
    queryKey: ['admin', 'moderation', 'queue', status, typeFilter],
    queryFn: () =>
      moderationApi.list({
        status,
        targetType: typeFilter === 'all' ? undefined : typeFilter,
        limit: 50,
      }),
  });

  const scan = useMutation({
    mutationFn: () => moderationApi.scan(),
    onSuccess: (data) => {
      toast.success(
        t('scanComplete', { created: data.flagged.created, updated: data.flagged.updated }),
      );
      qc.invalidateQueries({ queryKey: ['admin', 'moderation'] });
    },
    onError: (e) =>
      toast.error(e instanceof ApiClientError ? e.message : t('scanFailed')),
  });

  const decide = useMutation({
    mutationFn: ({
      id,
      decision,
      note,
    }: {
      id: string;
      decision: 'approve' | 'hide' | 'remove' | 'unhide';
      note?: string;
    }) => moderationApi.decide(id, { decision, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'moderation'] });
      toast.success(t('decisionRecorded'));
    },
    onError: (e) =>
      toast.error(e instanceof ApiClientError ? e.message : t('actionFailed')),
  });

  const o = overview.data;

  return (
    <>
      <PageHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        actions={
          <Button
            onClick={() => scan.mutate()}
            disabled={scan.isPending}
            className="gap-1.5"
          >
            {scan.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {t('runScan')}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={AlertTriangle}
          label={t('pending')}
          value={o?.pending ?? '—'}
          sublabel={t('pendingSub')}
          tone="accent"
        />
        <StatCard
          icon={CheckCircle2}
          label={t('approved')}
          value={o?.approved ?? '—'}
          sublabel={t('approvedSub')}
          tone="primary"
        />
        <StatCard
          icon={EyeOff}
          label={t('hidden')}
          value={o?.hidden ?? '—'}
          sublabel={t('hiddenSub')}
          tone="tertiary"
        />
        <StatCard
          icon={Trash2}
          label={t('removed')}
          value={o?.removed ?? '—'}
          sublabel={t('removedSub')}
          tone="destructive"
        />
      </div>

      {o && (o.pendingByType.habit + o.pendingByType.checklist_item + o.pendingByType.dhikr) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('pendingBreakdown')}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('pendingBreakdownDesc')}
            </p>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-3">
              {(['habit', 'checklist_item', 'dhikr'] as ModerationTargetType[]).map(
                (typ) => {
                  const meta = TYPE_META[typ];
                  const Icon = meta.icon;
                  const localizedLabel =
                    typ === 'habit' ? t('habit') : typ === 'checklist_item' ? t('checklistItem') : t('dhikr');
                  return (
                    <li
                      key={typ}
                      className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 px-3 py-2"
                    >
                      <div className="grid size-9 place-items-center rounded-lg bg-primary/12 text-primary">
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{localizedLabel}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {t('pendingReview')}
                        </p>
                      </div>
                      <span className="font-display text-xl font-bold tabular-nums">
                        {o.pendingByType[typ]}
                      </span>
                    </li>
                  );
                },
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            {t('queue')}
          </CardTitle>
          {queue.data && (
            <Badge variant="outline" className="tabular-nums">
              {t('flagsCount', { n: queue.data.meta.total })}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs
            value={status}
            onValueChange={(v) => setStatus(v as ModerationStatus | 'all')}
          >
            <TabsList>
              <TabsTrigger value="pending">{t('tabPending')}</TabsTrigger>
              <TabsTrigger value="hidden">{t('tabHidden')}</TabsTrigger>
              <TabsTrigger value="approved">{t('tabApproved')}</TabsTrigger>
              <TabsTrigger value="removed">{t('tabRemoved')}</TabsTrigger>
              <TabsTrigger value="all">{t('tabAll')}</TabsTrigger>
            </TabsList>
            {(['pending', 'hidden', 'approved', 'removed', 'all'] as const).map(
              (s) => (
                <TabsContent key={s} value={s}>
                  <TypeFilter value={typeFilter} onChange={setTypeFilter} t={t} />

                  {queue.isLoading && (
                    <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      {t('loadingQueue')}
                    </div>
                  )}
                  {queue.data && queue.data.items.length === 0 && (
                    <EmptyState status={s} t={t} />
                  )}
                  {queue.data && queue.data.items.length > 0 && (
                    <ul className="space-y-2">
                      {queue.data.items.map((flag) => (
                        <FlagRow
                          key={flag.id}
                          flag={flag}
                          onDecide={(decision) =>
                            decide.mutate({ id: flag.id, decision })
                          }
                          loading={decide.isPending}
                          t={t}
                        />
                      ))}
                    </ul>
                  )}
                </TabsContent>
              ),
            )}
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}

function TypeFilter({
  value,
  onChange,
  t,
}: {
  value: ModerationTargetType | 'all';
  onChange: (v: ModerationTargetType | 'all') => void;
  t: (key: string) => string;
}) {
  const options: { value: ModerationTargetType | 'all'; label: string }[] = [
    { value: 'all', label: t('allTypes') },
    { value: 'habit', label: t('habits') },
    { value: 'checklist_item', label: t('checklist') },
    { value: 'dhikr', label: t('dhikr') },
  ];
  return (
    <div className="mb-3 flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            value === o.value
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border/60 bg-card/40 text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function EmptyState({
  status,
  t,
}: {
  status: ModerationStatus | 'all';
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const message =
    status === 'pending'
      ? t('inboxClear')
      : status === 'all'
        ? t('noFlags')
        : t('noStatusFlags', { status });
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
      <ShieldCheck className="mb-3 size-8 text-muted-foreground/40" />
      <p className="font-medium">{message}</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        {t('queueHint')}
      </p>
    </div>
  );
}

function FlagRow({
  flag,
  onDecide,
  loading,
  t,
}: {
  flag: ModerationFlag;
  onDecide: (decision: 'approve' | 'hide' | 'remove' | 'unhide') => void;
  loading: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const meta = TYPE_META[flag.targetType];
  const Icon = meta.icon;
  const typeLabel =
    flag.targetType === 'habit'
      ? t('habit')
      : flag.targetType === 'checklist_item'
        ? t('checklistItem')
        : t('dhikr');

  return (
    <li className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase">
              {typeLabel}
            </Badge>
            <Badge variant={STATUS_TONE[flag.status]} className="text-[10px]">
              {flag.status}
            </Badge>
            {flag.reasons.map((r) => (
              <Badge
                key={r}
                variant="secondary"
                className="text-[10px] uppercase tracking-wide"
              >
                {r.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
          <p className="mt-2 break-words text-sm font-medium leading-snug">
            {flag.contentSnapshot || '—'}
          </p>
          {flag.contextSnapshot && (
            <p className="mt-1 break-words text-xs text-muted-foreground">
              {flag.contextSnapshot}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Avatar
              src={undefined}
              name={flag.user.name}
              size={20}
              rounded="full"
            />
            <span className="truncate">{flag.user.name}</span>
            <span aria-hidden>·</span>
            <span className="truncate">{flag.user.email}</span>
            <span aria-hidden>·</span>
            <span>{formatRelative(flag.createdAt)}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-1.5">
          {flag.status !== 'approved' && (
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => onDecide('approve')}
              className="gap-1.5"
            >
              <CheckCircle2 className="size-3.5" />
              {t('approve')}
            </Button>
          )}
          {flag.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => onDecide('hide')}
              className="gap-1.5"
            >
              <EyeOff className="size-3.5" />
              {t('hide')}
            </Button>
          )}
          {flag.status === 'hidden' && (
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => onDecide('unhide')}
              className="gap-1.5"
            >
              <Undo2 className="size-3.5" />
              {t('unhide')}
            </Button>
          )}
          {flag.status !== 'removed' && (
            <Button
              variant="destructive"
              size="sm"
              disabled={loading}
              onClick={() => {
                if (confirm(t('confirmRemove'))) {
                  onDecide('remove');
                }
              }}
              className="gap-1.5"
            >
              <Trash2 className="size-3.5" />
              {t('removeAction')}
            </Button>
          )}
        </div>
      </div>

      {flag.decidedBy && flag.decidedAt && (
        <div className="mt-3 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
          {t('lastActionBy', {
            name: flag.decidedBy.name,
            when: formatRelative(flag.decidedAt),
          })}
          {flag.decisionNote && <> · &ldquo;{flag.decisionNote}&rdquo;</>}
        </div>
      )}
    </li>
  );
}
