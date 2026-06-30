'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ListTodo, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/dashboard/page-header';
import { DatePickerBar } from '@/components/dashboard/date-picker-bar';
import { GeometricPattern } from '@/components/shared/geometric-pattern';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChecklistDay, useUpsertChecklistDay } from '@/hooks/use-checklist';
import { toDayKey, cn } from '@/lib/utils';
import type { ChecklistItem } from '@/lib/checklist/checklist-api';

interface DraftItem extends ChecklistItem {
  id: string;
}

export default function ChecklistPage() {
  const t = useTranslations('Checklist');
  const tCommon = useTranslations('Common');

  const [date, setDate] = useState<string>(() => toDayKey(new Date()));
  const { data, isLoading } = useChecklistDay(date);
  const upsert = useUpsertChecklistDay(date);

  const [items, setItems] = useState<DraftItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newPoints, setNewPoints] = useState(5);
  const newInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!data) return;
    setItems(
      (data.items ?? []).map((it, i) => ({
        ...it,
        id: it._id ?? `local-${i}`,
      })),
    );
  }, [data]);

  const totalPoints = useMemo(
    () => items.filter((i) => i.completed).reduce((sum, i) => sum + (i.rewardPoints ?? 0), 0),
    [items],
  );
  const completedCount = items.filter((i) => i.completed).length;

  const persist = (next: DraftItem[]) => {
    setItems(next);
    upsert.mutate(next.map(({ id: _id, ...rest }) => rest));
  };

  const toggleItem = (id: string) => {
    persist(items.map((it) => (it.id === id ? { ...it, completed: !it.completed } : it)));
  };

  const updateItem = (id: string, patch: Partial<ChecklistItem>) => {
    persist(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const removeItem = (id: string) => {
    persist(items.filter((it) => it.id !== id));
  };

  const addItem = () => {
    const title = newTitle.trim();
    if (!title) return;
    if (items.length >= 50) {
      toast.error(t('limit_error'));
      return;
    }
    const next: DraftItem = {
      id: `local-${Date.now()}`,
      title,
      rewardPoints: newPoints,
      completed: false,
    };
    persist([...items, next]);
    setNewTitle('');
    setNewPoints(5);
    newInputRef.current?.focus();
  };

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <DatePickerBar date={date} onChange={setDate} />

      <div className="relative mb-6 overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/5 p-5 sm:p-6 md:p-8">
        <GeometricPattern className="text-primary" opacity={0.05} />
        <div
          className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-primary/15 blur-3xl"
          aria-hidden
        />
        <div className="relative grid gap-5 md:grid-cols-[auto_1fr] md:items-center md:gap-6">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-soft text-primary-foreground shadow-md sm:size-14">
            <ListTodo className="size-5 sm:size-6" />
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:tracking-[0.2em]">
                {t('todays_tasks')}
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
                {t('done_count', { done: completedCount, total: items.length })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:tracking-[0.2em]">
                {t('earned')}
              </p>
              <p
                className={cn(
                  'mt-1 text-2xl font-bold tabular-nums sm:text-3xl',
                  totalPoints > 0 ? 'text-gradient' : 'text-muted-foreground',
                )}
              >
                {totalPoints > 0 ? '+' : ''}
                {totalPoints}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-10 text-center text-sm text-muted-foreground">
              {t('empty')}
            </div>
          )}

          {items.map((it) => (
            <div
              key={it.id}
              className={cn(
                'group flex items-center gap-2.5 rounded-2xl border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm sm:gap-3',
                it.completed
                  ? 'border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card'
                  : 'border-border/60',
              )}
            >
              <button
                type="button"
                onClick={() => toggleItem(it.id)}
                className={cn(
                  'grid size-7 shrink-0 place-items-center rounded-full border-2 transition-all',
                  it.completed
                    ? 'border-primary bg-gradient-to-br from-primary to-primary-soft text-primary-foreground shadow-sm'
                    : 'border-border hover:border-primary/60',
                )}
                aria-pressed={it.completed}
                aria-label={it.completed ? t('mark_incomplete') : t('mark_complete')}
              >
                {it.completed && <Check className="size-4" />}
              </button>

              <input
                value={it.title}
                onChange={(e) => updateItem(it.id, { title: e.target.value })}
                placeholder={t('task_title_placeholder')}
                className={cn(
                  'min-w-0 flex-1 bg-transparent text-sm outline-none transition-colors',
                  it.completed && 'text-muted-foreground line-through',
                )}
              />

              <div className="flex shrink-0 items-center gap-1">
                <input
                  type="number"
                  value={it.rewardPoints}
                  onChange={(e) =>
                    updateItem(it.id, { rewardPoints: Number(e.target.value) || 0 })
                  }
                  className="w-12 rounded-md border border-border bg-background px-1.5 py-1 text-center text-xs tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-14"
                  aria-label="Reward points"
                />
                <span className="hidden text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline">
                  {t('pts')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => removeItem(it.id)}
                className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground/60 transition-all hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                aria-label={tCommon('delete')}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}

          {/* Add item bar */}
          <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-border/60 bg-card/40 p-3 sm:gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-dashed border-border">
              <Plus className="size-3.5 text-muted-foreground" />
            </span>
            <Input
              ref={newInputRef}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              placeholder={t('task_placeholder')}
              className="min-w-0 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <div className="flex shrink-0 items-center gap-1">
              <input
                type="number"
                value={newPoints}
                onChange={(e) => setNewPoints(Number(e.target.value) || 0)}
                className="w-12 rounded-md border border-border bg-background px-1.5 py-1 text-center text-xs tabular-nums sm:w-14"
                aria-label="Reward points"
              />
              <span className="hidden text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline">
                {t('pts')}
              </span>
            </div>
            <Button
              onClick={addItem}
              size="sm"
              className="shrink-0 rounded-full"
              disabled={!newTitle.trim()}
            >
              {tCommon('add')}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
