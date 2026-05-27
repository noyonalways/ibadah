'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BookOpen,
  HandHeart,
  Heart,
  ListChecks,
  ListTodo,
  Loader2,
  PauseCircle,
  PlayCircle,
  ShieldOff,
  Sparkles,
  Trash2,
} from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCurrentAdmin } from '@/hooks/use-auth';
import { usersApi, type UpdateUserDto } from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';
import { cn, formatRelative } from '@/lib/utils';

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const me = useCurrentAdmin();
  const isMe = me.user?.id === params.id;

  const detail = useQuery({
    queryKey: ['admin', 'users', params.id],
    queryFn: () => usersApi.get(params.id),
    enabled: Boolean(params.id),
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

  const { user, activity } = detail.data;
  const peakDay = activity.last30d.reduce(
    (best, d) => (d.total > (best?.total ?? 0) ? d : best),
    activity.last30d[0],
  );

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

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Main column */}
        <div className="space-y-4">
          {/* Identity card */}
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

          {/* Activity stats */}
          <Card>
            <CardHeader>
              <CardTitle>Activity (last 30 days)</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Read-only summary of the user's logged worship.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Pillar grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                <ActivityTile label="Salah" value={activity.salahDays} icon={Heart} suffix="d" />
                <ActivityTile
                  label="Quran"
                  value={activity.totalQuranPages}
                  icon={BookOpen}
                  suffix="pgs"
                />
                <ActivityTile
                  label="Habits"
                  value={activity.habitDays}
                  icon={ListChecks}
                  suffix="d"
                />
                <ActivityTile
                  label="Checklist"
                  value={activity.checklistDays}
                  icon={ListTodo}
                  suffix="d"
                />
                <ActivityTile
                  label="Dhikr"
                  value={activity.dhikrDays}
                  icon={HandHeart}
                  suffix="d"
                />
              </div>

              {/* Mini sparkline */}
              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Daily total points
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Total: <strong className="text-foreground">{activity.totalPoints}</strong>
                    {peakDay?.total ? (
                      <>
                        {' · peak '}
                        <strong className="text-foreground">{peakDay.total}</strong> on{' '}
                        <span className="font-mono text-[11px]">{peakDay.date}</span>
                      </>
                    ) : null}
                  </p>
                </div>
                <SparkBars data={activity.last30d} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side rail: actions */}
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

            <div className="pt-3 border-t border-border/60">
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
                You cannot demote, suspend or delete <em>your own</em> admin
                account. Sign in as another admin first.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ActivityTile({
  label,
  value,
  icon: Icon,
  suffix,
}: {
  label: string;
  value: number;
  icon: typeof Heart;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <Icon className="mb-2 size-4 text-primary" />
      <p className="font-display text-2xl font-bold tabular-nums leading-none">
        {value}
        {suffix && <span className="ml-0.5 text-xs font-medium text-muted-foreground">{suffix}</span>}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function SparkBars({ data }: { data: { date: string; total: number }[] }) {
  if (data.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-center text-xs text-muted-foreground">
        No daily activity in this window.
      </p>
    );
  }
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div
      className="grid items-end gap-0.5"
      style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
    >
      {data.map((d) => {
        const h = Math.max(2, Math.round((d.total / max) * 56));
        return (
          <div
            key={d.date}
            className={cn(
              'rounded-sm bg-gradient-to-t from-primary to-accent transition-all hover:from-primary-deep hover:to-accent-deep',
              d.total === 0 && 'bg-muted/60',
            )}
            style={{ height: `${h}px` }}
            title={`${d.date}: ${d.total}`}
            aria-label={`${d.date}: ${d.total} points`}
          />
        );
      })}
    </div>
  );
}
