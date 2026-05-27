'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Flame, ListChecks, ListTodo, Loader2, Trophy } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { leaderboardApi } from '@/lib/admin-api';
import { cn, toDayKey } from '@/lib/utils';

const RANGE_PRESETS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range' },
] as const;

type RangeValue = (typeof RANGE_PRESETS)[number]['value'];

function rangeToDates(range: RangeValue): { from: string; to: string } | null {
  const today = toDayKey(new Date());
  if (range === 'custom') return null;
  const days = parseInt(range, 10);
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  return { from: toDayKey(start), to: today };
}

export default function LeaderboardPage() {
  const [range, setRange] = useState<RangeValue>('30');
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);
  const [limit, setLimit] = useState<number>(20);

  const computed = range === 'custom' ? { from, to } : rangeToDates(range)!;

  const board = useQuery({
    queryKey: ['admin', 'leaderboard', computed.from, computed.to, limit],
    queryFn: () =>
      leaderboardApi.fetch({
        from: computed.from,
        to: computed.to,
        limit,
      }),
  });

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Leaderboard"
        description="The most active users by total score over a chosen window. Read-only — administrators do not edit user data."
      />

      {/* Filters */}
      <Card>
        <CardContent className="grid gap-3 p-5 md:grid-cols-[200px_1fr_1fr_140px]">
          <div className="space-y-1.5">
            <Label className="text-xs">Range</Label>
            <Select value={range} onValueChange={(v) => setRange(v as RangeValue)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGE_PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">From</Label>
            <DatePicker
              value={range === 'custom' ? from : computed.from}
              onChange={range === 'custom' ? setFrom : undefined}
              disabled={range !== 'custom'}
              maxDate={range === 'custom' ? to : undefined}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">To</Label>
            <DatePicker
              value={range === 'custom' ? to : computed.to}
              onChange={range === 'custom' ? setTo : undefined}
              disabled={range !== 'custom'}
              minDate={range === 'custom' ? from : undefined}
              maxDate={toDayKey(new Date())}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Top N</Label>
            <Select
              value={String(limit)}
              onValueChange={(v) => setLimit(parseInt(v, 10) || 20)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Board */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-4 text-accent-deep" />
            {RANGE_PRESETS.find((r) => r.value === range)?.label}
          </CardTitle>
          {board.data && (
            <Badge variant="outline" className="tabular-nums">
              {board.data.length} {board.data.length === 1 ? 'user' : 'users'}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {board.isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Computing leaderboard…
            </div>
          )}

          {board.data && board.data.length === 0 && (
            <div className="grid place-items-center rounded-xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
              <Trophy className="mb-3 size-8 text-muted-foreground/40" />
              <p className="font-medium">No activity in this window</p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Try a longer date range, or check back once users have logged some worship.
              </p>
            </div>
          )}

          {board.data && board.data.length > 0 && (
            <ol className="space-y-2">
              {board.data.map((entry, i) => {
                const rank = i + 1;
                const tone =
                  rank === 1
                    ? 'border-accent/40 bg-gradient-to-r from-accent/8 via-card to-card'
                    : rank === 2
                      ? 'border-border/60 bg-card'
                      : rank === 3
                        ? 'border-primary/30 bg-gradient-to-r from-primary/5 via-card to-card'
                        : 'border-border/40 bg-card';
                return (
                  <li
                    key={entry.user.id}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3 transition-colors',
                      tone,
                    )}
                  >
                    <RankBadge rank={rank} />
                    <Avatar src={entry.user.avatarUrl} name={entry.user.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{entry.user.name}</p>
                        {entry.user.role === 'admin' && (
                          <Badge variant="success" className="text-[9px]">
                            admin
                          </Badge>
                        )}
                        {entry.user.suspended && (
                          <Badge variant="destructive" className="text-[9px]">
                            suspended
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {entry.user.email}
                      </p>
                    </div>

                    {/* Pillar mini-bars */}
                    <div className="hidden gap-3 md:flex">
                      <Pill
                        label="Salah"
                        value={entry.salahPoints}
                        icon={Flame}
                      />
                      <Pill
                        label="Habits"
                        value={entry.habitPoints}
                        icon={ListChecks}
                      />
                      <Pill
                        label="Checklist"
                        value={entry.checklistPoints}
                        icon={ListTodo}
                      />
                      <Pill
                        label="Pages"
                        value={entry.quranPages}
                        icon={BookOpen}
                      />
                    </div>

                    <div className="text-right">
                      <p className="font-display text-xl font-bold tabular-nums">
                        {entry.totalPoints}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        pts
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function Pill({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Flame;
}) {
  return (
    <div className="grid place-items-center rounded-lg border border-border/50 bg-muted/20 px-2 py-1.5">
      <Icon className="size-3 text-muted-foreground" />
      <span className="text-xs font-medium tabular-nums">{value}</span>
      <span className="text-[8px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const cls =
    rank === 1
      ? 'bg-gradient-to-br from-accent to-accent-deep text-accent-foreground'
      : rank === 2
        ? 'bg-gradient-to-br from-muted to-muted-foreground/40 text-foreground'
        : rank === 3
          ? 'bg-gradient-to-br from-primary/30 to-primary/15 text-primary'
          : 'bg-muted/60 text-muted-foreground';
  return (
    <span
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-full font-display text-sm font-semibold tabular-nums shadow-sm',
        cls,
      )}
    >
      {rank}
    </span>
  );
}
