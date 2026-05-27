'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Loader2,
  PauseCircle,
  PlayCircle,
  ShieldOff,
  Sparkles,
  Trash2,
} from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { RangePicker, type RangeValue } from '@/components/admin/range-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCurrentAdmin } from '@/hooks/use-auth';
import { analyticsApi, usersApi, type UpdateUserDto } from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';
import { formatRelative } from '@/lib/utils';

import { ChartCard, ChartBadge } from '@/components/admin/charts/chart-card';
import { TimeSeriesChart } from '@/components/admin/charts/time-series-chart';
import { Heatmap } from '@/components/admin/charts/heatmap';
import { PillarBreakdown } from '@/components/admin/charts/pillar-breakdown';
import {
  SalahStatusDonut,
  SalahStatusLegend,
} from '@/components/admin/charts/salah-status';


export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const me = useCurrentAdmin();
  const isMe = me.user?.id === params.id;
  const [range, setRange] = useState<RangeValue | null>(null);

  const detail = useQuery({
    queryKey: ['admin', 'users', params.id],
    queryFn: () => usersApi.get(params.id),
    enabled: Boolean(params.id),
  });

  const analytics = useQuery({
    queryKey: ['admin', 'users', params.id, 'analytics', range?.from, range?.to],
    queryFn: () => analyticsApi.forUser(params.id, range ?? {}),
    enabled: Boolean(params.id) && Boolean(range),
  });

  const update = useMutation({
    mutationFn: (body: UpdateUserDto) => usersApi.update(params.id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User updated');
    },
    onError: (e) => toast.error(e instanceof ApiClientError ? e.message : 'Update failed'),
  });

  const remove = useMutation({
    mutationFn: () => usersApi.remove(params.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'metrics'] });
      qc.invalidateQueries({ queryKey: ['admin', 'analytics'] });
      toast.success('User deleted');
      router.push('/users');
    },
    onError: (e) => toast.error(e instanceof ApiClientError ? e.message : 'Delete failed'),
  });

  if (detail.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading user…
      </div>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <Card>
        <CardContent className="grid place-items-center px-6 py-14 text-center">
          <p className="font-medium">Could not load user</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {detail.error instanceof ApiClientError
              ? detail.error.message
              : 'The user may have been deleted, or you no longer have access.'}
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/users">
              <ArrowLeft className="size-3.5" />
              Back to users
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { user } = detail.data;
  const a = analytics.data;


  return (
    <>
      <PageHeader
        eyebrow="Manage"
        title={user.name}
        description={user.email}
        actions={
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href="/users">
              <ArrowLeft className="size-3.5" />
              All users
            </Link>
          </Button>
        }
      />

      {/* Identity card + side-rail account actions */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <Avatar src={user.avatarUrl} name={user.name} size={72} rounded="2xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-lg font-semibold">{user.name}</p>
                {user.role === 'admin' && <Badge variant="success">admin</Badge>}
                {user.suspended && <Badge variant="destructive">suspended</Badge>}
                {isMe && <Badge variant="outline">you</Badge>}
              </div>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Joined {formatRelative(user.createdAt)} · Last active{' '}
                {formatRelative(user.lastActiveAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Account actions</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Administrators do not edit user worship data — only account state.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {user.role === 'admin' ? (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                disabled={isMe || update.isPending}
                onClick={() => update.mutate({ role: 'user' })}
              >
                <ShieldOff className="size-4" />
                Demote to user
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                disabled={update.isPending}
                onClick={() => update.mutate({ role: 'admin' })}
              >
                <Sparkles className="size-4" />
                Promote to admin
              </Button>
            )}

            {user.suspended ? (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                disabled={update.isPending}
                onClick={() => update.mutate({ suspended: false })}
              >
                <PlayCircle className="size-4" />
                Unsuspend account
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                disabled={isMe || update.isPending}
                onClick={() => update.mutate({ suspended: true })}
              >
                <PauseCircle className="size-4" />
                Suspend account
              </Button>
            )}

            <div className="border-t border-border/60 pt-3">
              <Button
                variant="destructive"
                className="w-full justify-start gap-2"
                disabled={isMe || remove.isPending}
                onClick={() => {
                  const ok = confirm(
                    `Permanently delete ${user.email}?\n\nThis wipes all salah / quran / habits / checklist / dhikr data for this user. This cannot be undone.`,
                  );
                  if (ok) remove.mutate();
                }}
              >
                <Trash2 className="size-4" />
                Delete user & all data
              </Button>
            </div>

            {isMe && (
              <p className="rounded-md border border-dashed border-border/60 bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
                You cannot demote, suspend or delete your own admin account. Sign in as another
                admin first.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <RangePicker defaultPreset="90" onChange={setRange} />

      {analytics.isLoading || !a ? (
        <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Computing analytics for this user…
        </div>
      ) : (
        <>
          <PillarBreakdown pillars={a.pillars} />

          <ChartCard
            title="Daily activity heatmap"
            description="Each cell is one day. Color intensity tracks total points (salah + habits + checklist) for that day."
            badge={<ChartBadge>{a.range.days} days</ChartBadge>}
          >
            <Heatmap data={a.daily.map((d) => ({ date: d.date, value: d.totalPoints }))} />
          </ChartCard>

          <ChartCard
            title="Daily points by pillar"
            description="Where this user's score is coming from over the chosen window."
            badge={<ChartBadge>{a.range.days} days</ChartBadge>}
          >
            <TimeSeriesChart
              data={a.daily}
              series={[
                { key: 'salahPoints', label: 'Salah', color: 'primary' },
                { key: 'habitPoints', label: 'Habits', color: 'tertiary' },
                { key: 'checklistPoints', label: 'Checklist', color: 'accent-deep' },
              ]}
            />
          </ChartCard>

          <ChartCard
            title="Daily content volume"
            description="Quran pages and dhikr recitations logged per day."
            badge={<ChartBadge>{a.range.days} days</ChartBadge>}
          >
            <TimeSeriesChart
              data={a.daily}
              series={[
                { key: 'quranPages', label: 'Quran pages', color: 'accent' },
                { key: 'dhikrCount', label: 'Dhikr count', color: 'chart-3' },
              ]}
            />
          </ChartCard>

          <ChartCard
            title="Salah timing — this user"
            description="How this user's prayer timing breaks down over the window."
          >
            <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
              <SalahStatusDonut counts={a.pillars.salah.statusCounts} />
              <SalahStatusLegend counts={a.pillars.salah.statusCounts} />
            </div>
          </ChartCard>
        </>
      )}
    </>
  );
}
