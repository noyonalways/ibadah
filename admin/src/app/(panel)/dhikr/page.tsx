'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Minus, Plus, Save } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dhikrApi, type DhikrEntry } from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';
import { cn, toDayKey } from '@/lib/utils';

export default function DhikrAdminPage() {
  const [date, setDate] = useState(toDayKey(new Date()));
  const [entries, setEntries] = useState<DhikrEntry[]>([]);
  const qc = useQueryClient();

  const day = useQuery({
    queryKey: ['admin', 'dhikr', date],
    queryFn: () => dhikrApi.getDay(date),
  });

  useEffect(() => {
    if (day.data?.entries) setEntries(day.data.entries);
  }, [day.data]);

  const save = useMutation({
    mutationFn: () => dhikrApi.upsertDay(date, entries),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'dhikr', date] });
      toast.success('Saved');
    },
    onError: (e) => toast.error(e instanceof ApiClientError ? e.message : 'Save failed'),
  });

  const setEntry = (idx: number, patch: Partial<DhikrEntry>) =>
    setEntries((arr) => arr.map((e, i) => (i === idx ? { ...e, ...patch } : e)));

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Dhikr"
        description="Daily counts vs targets for each preset. Admins can adjust targets and counts."
        actions={
          <div className="flex items-center gap-2">
            <Label htmlFor="dhikr-date" className="text-xs text-muted-foreground">
              Date
            </Label>
            <Input
              id="dhikr-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || toDayKey(new Date()))}
              className="w-[160px]"
            />
          </div>
        }
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{date}</CardTitle>
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            size="sm"
            className="gap-1.5"
          >
            {save.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save
          </Button>
        </CardHeader>

        <CardContent className="space-y-3">
          {day.isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading…
            </div>
          )}

          {entries.map((entry, idx) => {
            const pct = entry.target > 0 ? Math.min(100, (entry.count / entry.target) * 100) : 0;
            const done = entry.count >= entry.target && entry.target > 0;
            return (
              <div
                key={entry.slug}
                className={cn(
                  'rounded-xl border p-4 transition-colors',
                  done ? 'border-primary/30 bg-primary/5' : 'border-border/60 bg-card',
                )}
              >
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{entry.label}</p>
                    {entry.arabic && (
                      <p className="font-display text-base text-foreground/85" dir="rtl" lang="ar">
                        {entry.arabic}
                      </p>
                    )}
                  </div>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    <span className="font-semibold text-foreground">{entry.count}</span> /{' '}
                    {entry.target}
                  </p>
                </div>

                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent-deep transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Stepper
                    value={entry.count}
                    onChange={(v) => setEntry(idx, { count: Math.max(0, v) })}
                  />
                  <div className="ml-auto flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Target</Label>
                    <Input
                      type="number"
                      min={0}
                      value={entry.target}
                      onChange={(e) =>
                        setEntry(idx, { target: Math.max(0, Number(e.target.value) || 0) })
                      }
                      className="h-8 w-20 text-xs tabular-nums"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </>
  );
}

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card p-1">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        className="grid size-7 place-items-center rounded-full hover:bg-muted/60"
        aria-label="Decrement"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="min-w-[2.5rem] text-center text-sm font-medium tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        aria-label="Increment"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
