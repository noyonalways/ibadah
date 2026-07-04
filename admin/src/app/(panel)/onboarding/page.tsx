'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HandHeart,
  ListChecks,
  Loader2,
  RefreshCw,
  Smartphone,
  Sparkles,
  Sprout,
  Sun,
  Undo2,
  User2,
  Users,
} from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { StatCard } from '@/components/admin/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
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
import {
  onboardingApi,
  type OnboardingFocus,
  type OnboardingPersona,
  type OnboardingSubmission,
} from '@/lib/admin/admin-api';
import { formatRelative, cn, toDayKey } from '@/lib/utils';

const PERSONA_META: Record<
  OnboardingPersona,
  { label: string; icon: typeof Sprout; tone: string }
> = {
  beginner: {
    label: 'Beginner',
    icon: Sprout,
    tone: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  },
  consistent: {
    label: 'Consistent',
    icon: Sun,
    tone: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  },
  returning: {
    label: 'Returning',
    icon: Undo2,
    tone: 'bg-primary/15 text-primary',
  },
};

const FOCUS_META: Record<OnboardingFocus, { label: string; icon: typeof CheckCircle2 }> = {
  salah: { label: 'Salah', icon: CheckCircle2 },
  quran: { label: 'Quran', icon: BookOpen },
  dhikr: { label: 'Dhikr', icon: HandHeart },
  habits: { label: 'Habits', icon: ListChecks },
  checklist: { label: 'Checklist', icon: Sparkles },
};

export default function OnboardingPage() {
  const t = useTranslations('Onboarding');
  const tCommon = useTranslations('Common');
  const [page, setPage] = useState(1);
  const [personaFilter, setPersonaFilter] = useState<string>('');
  const [localeFilter, setLocaleFilter] = useState<string>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const summary = useQuery({
    queryKey: ['admin', 'onboarding', 'summary'],
    queryFn: () => onboardingApi.summary(30),
  });

  const list = useQuery({
    queryKey: ['admin', 'onboarding', 'list', page, personaFilter, localeFilter, from, to],
    queryFn: () =>
      onboardingApi.list({
        page,
        limit: 25,
        persona: (personaFilter || undefined) as OnboardingPersona | undefined,
        locale: localeFilter || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
  });

  const topPersona = summary.data?.byPersona[0];
  const topFocus = summary.data?.byFocus[0];

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
            onClick={() => {
              void summary.refetch();
              void list.refetch();
            }}
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Smartphone}
          label={t('submissions30d')}
          value={summary.data?.recent ?? '—'}
          sublabel={t('totalAllTime', { n: summary.data?.total ?? 0 })}
          tone="primary"
        />
        <StatCard
          icon={Users}
          label={t('signedIn')}
          value={summary.data?.linkedUsers ?? '—'}
          sublabel={t('anonymous', { n: summary.data?.anonymous ?? 0 })}
          tone="accent"
        />
        <StatCard
          icon={Sprout}
          label={t('topPersona')}
          value={topPersona?.persona ?? '—'}
          sublabel={t('countSub', { n: topPersona?.count ?? 0 })}
          tone="tertiary"
        />
        <StatCard
          icon={CheckCircle2}
          label={t('topFocus')}
          value={topFocus?.focus ?? '—'}
          sublabel={t('countSub', { n: topFocus?.count ?? 0 })}
          tone="primary"
        />
      </div>

      <Card>
        <CardContent className="grid gap-3 p-5 md:grid-cols-[180px_140px_180px_180px_auto]">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('personaLabel')}</Label>
            <Select
              value={personaFilter || '__all__'}
              onValueChange={(v) => {
                setPersonaFilter(v === '__all__' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('allPersonas')}</SelectItem>
                <SelectItem value="beginner">{t('persona_beginner')}</SelectItem>
                <SelectItem value="consistent">{t('persona_consistent')}</SelectItem>
                <SelectItem value="returning">{t('persona_returning')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('localeLabel')}</Label>
            <Select
              value={localeFilter || '__all__'}
              onValueChange={(v) => {
                setLocaleFilter(v === '__all__' ? '' : v);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t('allLocales')}</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="bn">বাংলা</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{tCommon('from')}</Label>
            <DatePicker
              value={from || undefined}
              placeholder={tCommon('from')}
              maxDate={to || undefined}
              onChange={(dayKey) => {
                setFrom(dayKey);
                setPage(1);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{tCommon('to')}</Label>
            <DatePicker
              value={to || undefined}
              placeholder={tCommon('to')}
              minDate={from || undefined}
              maxDate={toDayKey(new Date())}
              onChange={(dayKey) => {
                setTo(dayKey);
                setPage(1);
              }}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              disabled={!personaFilter && !localeFilter && !from && !to}
              onClick={() => {
                setPersonaFilter('');
                setLocaleFilter('');
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
            <Smartphone className="size-4 text-primary" />
            {t('submissions')}
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
              {t('loading')}
            </div>
          )}

          {list.data && list.data.items.length === 0 && (
            <div className="grid place-items-center rounded-xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
              <Smartphone className="mb-3 size-8 text-muted-foreground/40" />
              <p className="font-medium">{t('noSubmissions')}</p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">{t('noSubmissionsHint')}</p>
            </div>
          )}

          {list.data && list.data.items.length > 0 && (
            <ul className="space-y-2">
              {list.data.items.map((item) => (
                <SubmissionRow key={item.id} item={item} t={t} />
              ))}
            </ul>
          )}

          {list.data && list.data.meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
              <span>
                {tCommon('page')} {list.data.meta.page} {tCommon('of')} {list.data.meta.totalPages}{' '}
                · {list.data.meta.total} {t('submissions').toLowerCase()}
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
                    setPage((p) => Math.min(list.data?.meta.totalPages ?? 1, p + 1))
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

function SubmissionRow({
  item,
  t,
}: {
  item: OnboardingSubmission;
  t: (key: string) => string;
}) {
  const persona = PERSONA_META[item.persona];
  const PersonaIcon = persona.icon;
  const displayName = item.userName ?? t('anonymousVisitor');
  const displayEmail = item.userEmail;

  return (
    <li className="rounded-xl border border-border/60 bg-card p-3">
      <div className="flex flex-wrap items-start gap-3">
        <Avatar src={undefined} name={displayName} size={32} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{displayName}</span>
            {displayEmail && (
              <span className="text-[11px] text-muted-foreground">{displayEmail}</span>
            )}
            {!item.user && (
              <Badge variant="secondary" className="text-[10px]">
                {t('guest')}
              </Badge>
            )}
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold',
                persona.tone,
              )}
            >
              <PersonaIcon className="size-3" />
              {t(`persona_${item.persona}`)}
            </span>
            <Badge variant="outline" className="text-[10px] uppercase">
              {item.locale}
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.focus.map((focus) => {
              const meta = FOCUS_META[focus];
              const Icon = meta.icon;
              return (
                <span
                  key={focus}
                  className="inline-flex items-center gap-1 rounded border border-border/40 bg-muted/30 px-1.5 py-0.5 text-[11px]"
                >
                  <Icon className="size-3 text-primary" />
                  {meta.label}
                </span>
              );
            })}
          </div>

          <p className="mt-1.5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
            <User2 className="size-3" />
            {formatRelative(item.createdAt)}
            {item.ip && (
              <>
                <span aria-hidden>·</span>
                <span className="font-mono">{item.ip}</span>
              </>
            )}
          </p>
        </div>
      </div>
    </li>
  );
}
