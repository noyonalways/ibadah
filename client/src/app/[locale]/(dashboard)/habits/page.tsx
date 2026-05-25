'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ListChecks, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/dashboard/page-header';
import { DatePickerBar } from '@/components/dashboard/date-picker-bar';
import { GeometricPattern } from '@/components/shared/geometric-pattern';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useCreateHabit,
  useDeleteHabit,
  useHabitDay,
  useHabits,
  useUpdateHabit,
  useUpsertHabitDay,
} from '@/hooks/use-habit';
import { toDayKey, cn } from '@/lib/utils';
import type { Habit } from '@/lib/habit-api';
import { ApiClientError } from '@/lib/api';

export default function HabitsPage() {
  const [date, setDate] = useState<string>(() => toDayKey(new Date()));
  const [tab, setTab] = useState<'today' | 'manage'>('today');

  const habitsQ = useHabits();
  const dayQ = useHabitDay(date);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Habits"
        description="Build any habit with custom reward points. Fasting, charity, dua — your call."
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="today" className="space-y-6">
          <DatePickerBar date={date} onChange={setDate} />
          <TodayPanel date={date} habits={habitsQ.data ?? []} loading={habitsQ.isLoading || dayQ.isLoading} />
        </TabsContent>

        <TabsContent value="manage">
          <ManagePanel habits={habitsQ.data ?? []} loading={habitsQ.isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Today panel                                                               */
/* -------------------------------------------------------------------------- */

function TodayPanel({
  date,
  habits,
  loading,
}: {
  date: string;
  habits: Habit[];
  loading: boolean;
}) {
  const dayQ = useHabitDay(date);
  const upsert = useUpsertHabitDay(date);

  const completionMap = useMemo(() => {
    const m = new Map<string, boolean>();
    (dayQ.data?.entries ?? []).forEach((e) => m.set(e.habit, e.completed));
    return m;
  }, [dayQ.data]);

  const liveHabits = habits.filter((h) => !h.archived);
  const totalEarned = liveHabits
    .filter((h) => completionMap.get(h._id))
    .reduce((s, h) => s + (h.rewardPoints ?? 0), 0);
  const completed = liveHabits.filter((h) => completionMap.get(h._id)).length;

  const toggle = (habitId: string) => {
    const next = !completionMap.get(habitId);
    const newEntries = liveHabits.map((h) => ({
      habit: h._id,
      completed: h._id === habitId ? next : Boolean(completionMap.get(h._id)),
    }));
    upsert.mutate(newEntries);
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-16 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/5 p-6 md:p-8">
        <GeometricPattern className="text-primary" opacity={0.05} />
        <div
          className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-primary/15 blur-3xl"
          aria-hidden
        />
        <div className="relative grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-soft text-primary-foreground shadow-md">
            <ListChecks className="size-6" />
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Today&apos;s habits
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                <span className="tabular-nums">{completed}</span>
                <span className="ml-1 text-base font-medium text-muted-foreground">
                  / {liveHabits.length} done
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Earned
              </p>
              <p
                className={cn(
                  'mt-1 text-3xl font-bold tabular-nums',
                  totalEarned > 0 ? 'text-gradient' : 'text-muted-foreground',
                )}
              >
                {totalEarned > 0 ? '+' : ''}
                {totalEarned}
              </p>
            </div>
          </div>
        </div>
      </div>

      {liveHabits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-10 text-center text-sm text-muted-foreground">
          You haven&apos;t added any habits yet. Switch to the&nbsp;
          <span className="font-medium text-foreground">Manage</span> tab to create one.
        </div>
      ) : (
        <div className="space-y-2">
          {liveHabits.map((h) => {
            const done = completionMap.get(h._id) ?? false;
            return (
              <button
                key={h._id}
                type="button"
                onClick={() => toggle(h._id)}
                className={cn(
                  'group flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left transition-all hover:shadow-sm',
                  done
                    ? 'border-primary/30 bg-gradient-to-r from-primary/8 via-card to-card shadow-sm'
                    : 'border-border/60 hover:border-primary/30',
                )}
              >
                <span
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-xl border-2 transition-all',
                    done
                      ? 'border-primary bg-gradient-to-br from-primary to-primary-soft text-primary-foreground shadow-sm'
                      : 'border-border bg-background',
                  )}
                >
                  {done && <Check className="size-4" />}
                </span>
                <div className="flex-1">
                  <p className={cn('text-sm font-medium', done && 'text-foreground')}>
                    {h.name}
                  </p>
                  {h.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {h.description}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold tabular-nums ring-1 ring-inset',
                    done
                      ? 'bg-primary/15 text-primary ring-primary/30'
                      : 'bg-muted text-muted-foreground ring-transparent',
                  )}
                >
                  {h.rewardPoints > 0 ? '+' : ''}
                  {h.rewardPoints}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Manage panel — CRUD                                                       */
/* -------------------------------------------------------------------------- */

function ManagePanel({ habits, loading }: { habits: Habit[]; loading: boolean }) {
  const create = useCreateHabit();
  const remove = useDeleteHabit();

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="grid place-items-center py-16 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {habits.length === 0 && !adding && (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-10 text-center text-sm text-muted-foreground">
          Create your first habit below.
        </div>
      )}

      {habits.map((h) =>
        editingId === h._id ? (
          <HabitForm
            key={h._id}
            initial={h}
            onCancel={() => setEditingId(null)}
            onSaved={() => setEditingId(null)}
          />
        ) : (
          <div
            key={h._id}
            className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4"
          >
            <div className="flex-1">
              <p className="text-sm font-medium">{h.name}</p>
              {h.description && (
                <p className="mt-0.5 text-xs text-muted-foreground">{h.description}</p>
              )}
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tabular-nums text-primary">
              {h.rewardPoints > 0 ? '+' : ''}
              {h.rewardPoints}
            </span>
            <button
              type="button"
              onClick={() => setEditingId(h._id)}
              className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Edit"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete habit "${h.name}"?`)) remove.mutate(h._id);
              }}
              className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label="Delete"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ),
      )}

      {adding ? (
        <HabitForm
          onCancel={() => setAdding(false)}
          onSaved={() => setAdding(false)}
          submitLabel="Create habit"
          onSubmit={async (values) => {
            await create.mutateAsync(values);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/60 bg-card/40 p-5 text-sm font-medium text-muted-foreground transition-all hover:border-primary/40 hover:bg-card hover:text-foreground"
        >
          <Plus className="size-4" />
          New habit
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Habit create / edit form                                                  */
/* -------------------------------------------------------------------------- */

function HabitForm({
  initial,
  onCancel,
  onSaved,
  submitLabel = 'Save changes',
  onSubmit,
}: {
  initial?: Habit;
  onCancel: () => void;
  onSaved: () => void;
  submitLabel?: string;
  onSubmit?: (values: {
    name: string;
    description?: string;
    rewardPoints: number;
  }) => Promise<unknown>;
}) {
  const update = useUpdateHabit();

  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [rewardPoints, setRewardPoints] = useState(initial?.rewardPoints ?? 5);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Habit name is required');
      return;
    }
    setSaving(true);
    try {
      const values = {
        name: name.trim(),
        description: description.trim() || undefined,
        rewardPoints,
      };
      if (onSubmit) {
        await onSubmit(values);
      } else if (initial) {
        await update.mutateAsync({ id: initial._id, patch: values });
      }
      toast.success(initial ? 'Habit updated' : 'Habit created');
      onSaved();
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Could not save habit';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {initial ? 'Edit habit' : 'New habit'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <div>
          <Label htmlFor="habit-name" className="text-xs">
            Name
          </Label>
          <Input
            id="habit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Morning dua, Read before bed"
            autoFocus
          />
        </div>
        <div>
          <Label htmlFor="habit-points" className="text-xs">
            Reward points
          </Label>
          <Input
            id="habit-points"
            type="number"
            min={-100}
            max={100}
            value={rewardPoints}
            onChange={(e) => setRewardPoints(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="mt-3">
        <Label htmlFor="habit-desc" className="text-xs">
          Description (optional)
        </Label>
        <Textarea
          id="habit-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A short note to remind yourself why this matters."
          rows={2}
        />
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} className="rounded-full">
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving} className="rounded-full">
          {saving && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
