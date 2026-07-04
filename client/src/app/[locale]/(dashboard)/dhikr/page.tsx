'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { HandHeart, Loader2, Minus, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/dashboard/page-header';
import { DatePickerBar } from '@/components/dashboard/date-picker-bar';
import { GeometricPattern } from '@/components/shared/geometric-pattern';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDhikrEntries } from '@/hooks/use-dhikr';
import { toDayKey, cn } from '@/lib/utils';
import type { DhikrEntry } from '@/lib/dhikr/dhikr-api';

export default function DhikrPage() {
  const t = useTranslations('Dhikr');
  const tCommon = useTranslations('Common');
  const [date, setDate] = useState<string>(() => toDayKey(new Date()));
  const { entries, isLoading, setEntries } = useDhikrEntries(date);
  const [editingTargetSlug, setEditingTargetSlug] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newArabic, setNewArabic] = useState('');
  const [newTarget, setNewTarget] = useState(33);

  const totals = useMemo(() => {
    const total = entries.reduce((sum, e) => sum + e.count, 0);
    const target = entries.reduce((sum, e) => sum + e.target, 0);
    const completed = entries.filter((e) => e.target > 0 && e.count >= e.target).length;
    return { total, target, completed };
  }, [entries]);

  const updateAt = (
    slug: string,
    patch: Partial<DhikrEntry> | ((entry: DhikrEntry) => Partial<DhikrEntry>),
  ) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.slug !== slug) return e;
        const resolved = typeof patch === 'function' ? patch(e) : patch;
        return { ...e, ...resolved };
      }),
    );
  };

  const removeAt = (slug: string) => {
    setEntries((prev) => prev.filter((e) => e.slug !== slug));
  };

  const addCustom = () => {
    const label = newLabel.trim();
    if (!label) return;
    const slug = `custom-${label.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
    if (entries.length >= 50) {
      toast.error(t('limit_error'));
      return;
    }
    const next: DhikrEntry = {
      slug,
      label,
      arabic: newArabic.trim() || undefined,
      target: Math.max(0, newTarget),
      count: 0,
    };
    setEntries((prev) => [...prev, next]);
    setNewLabel('');
    setNewArabic('');
    setNewTarget(33);
    setAdding(false);
  };

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <DatePickerBar date={date} onChange={setDate} />

      {/* Hero summary */}
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-tertiary/10 p-5 sm:p-6 md:p-8">
        <GeometricPattern className="text-tertiary" opacity={0.05} />
        <div
          className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-tertiary/15 blur-3xl"
          aria-hidden
        />
        <div className="relative grid gap-5 md:grid-cols-[auto_1fr] md:items-center md:gap-6">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-tertiary to-primary text-primary-foreground shadow-md sm:size-14">
            <HandHeart className="size-5 sm:size-6" />
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <Stat label={t('total_count')} value={totals.total} />
            <Stat label={t('daily_target')} value={totals.target} />
            <Stat label={t('completed')} value={`${totals.completed}/${entries.length}`} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {entries.map((e) => (
              <DhikrCounterCard
                key={e.slug}
                entry={e}
                editing={editingTargetSlug === e.slug}
                onIncrement={() => updateAt(e.slug, (entry) => ({ count: entry.count + 1 }))}
                onDecrement={() =>
                  updateAt(e.slug, (entry) => ({ count: Math.max(0, entry.count - 1) }))
                }
                onReset={() => updateAt(e.slug, { count: 0 })}
                onEditTarget={() =>
                  setEditingTargetSlug(editingTargetSlug === e.slug ? null : e.slug)
                }
                onTargetChange={(t2) => updateAt(e.slug, { target: t2 })}
                onRemove={() => removeAt(e.slug)}
                t={t}
              />
            ))}
          </div>

          {/* Add custom dhikr */}
          <div className="mt-6">
            {adding ? (
              <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {t('add_custom')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setAdding(false)}
                    className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-[2fr_2fr_1fr_auto]">
                  <div>
                    <Label htmlFor="dhikr-label" className="text-xs">
                      {t('label_field')}
                    </Label>
                    <Input
                      id="dhikr-label"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder={t('label_placeholder')}
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label htmlFor="dhikr-arabic" className="text-xs">
                      {t('arabic_optional')}
                    </Label>
                    <Input
                      id="dhikr-arabic"
                      dir="rtl"
                      lang="ar"
                      value={newArabic}
                      onChange={(e) => setNewArabic(e.target.value)}
                      placeholder="أَسْتَغْفِرُ ٱللَّٰه"
                      className="font-display"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dhikr-target" className="text-xs">
                      {t('target_label')}
                    </Label>
                    <Input
                      id="dhikr-target"
                      type="number"
                      min={0}
                      value={newTarget}
                      onChange={(e) => setNewTarget(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={addCustom}
                      className="w-full rounded-full"
                      disabled={!newLabel.trim()}
                    >
                      {tCommon('add')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/60 bg-card/40 p-5 text-sm font-medium text-muted-foreground transition-all hover:border-primary/40 hover:bg-card hover:text-foreground"
              >
                <Plus className="size-4" />
                {t('add_custom')}
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:text-[10px] sm:tracking-[0.2em]">
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-bold tabular-nums tracking-tight sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

interface CounterCardProps {
  entry: DhikrEntry;
  editing: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onReset: () => void;
  onEditTarget: () => void;
  onTargetChange: (next: number) => void;
  onRemove: () => void;
  t: ReturnType<typeof useTranslations<'Dhikr'>>;
}

function DhikrCounterCard({
  entry,
  editing,
  onIncrement,
  onDecrement,
  onReset,
  onEditTarget,
  onTargetChange,
  onRemove,
  t,
}: CounterCardProps) {
  const completed = entry.target > 0 && entry.count >= entry.target;
  const pct = entry.target > 0 ? Math.min(100, (entry.count / entry.target) * 100) : 0;
  const isCustom = entry.slug.startsWith('custom-');

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all',
        completed
          ? 'border-primary/40 shadow-md shadow-primary/10'
          : 'border-border/60 hover:border-primary/30 hover:shadow-md',
      )}
    >
      {completed && (
        <div
          className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-primary/15 blur-2xl"
          aria-hidden
        />
      )}

      <div className="relative mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {entry.arabic && (
            <p
              className="font-display text-2xl leading-tight text-foreground/90"
              dir="rtl"
              lang="ar"
            >
              {entry.arabic}
            </p>
          )}
          <p className="mt-1 text-sm font-medium text-foreground">{entry.label}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isCustom && (
            <button
              type="button"
              onClick={onRemove}
              className="grid size-7 place-items-center rounded-full text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label={t('remove')}
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onReset}
            className="grid size-7 place-items-center rounded-full text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t('reset')}
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onIncrement}
        className={cn(
          'relative flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-7 transition-all active:scale-[0.985] sm:gap-4 sm:px-6 sm:py-8',
          completed
            ? 'bg-gradient-to-br from-primary/15 via-primary/5 to-transparent'
            : 'bg-gradient-to-br from-tertiary/8 via-card to-card hover:from-primary/10 hover:via-card',
        )}
        aria-label={t('tap_to_count', { label: entry.label })}
      >
        <span
          className={cn(
            'text-4xl font-bold tabular-nums tracking-tight sm:text-5xl',
            completed ? 'text-gradient' : 'text-foreground',
          )}
        >
          {entry.count}
        </span>
        {entry.target > 0 && (
          <span className="text-sm text-muted-foreground sm:text-base">
            / <span className="tabular-nums">{entry.target}</span>
          </span>
        )}
      </button>

      {entry.target > 0 && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-500 ease-out',
              completed
                ? 'bg-gradient-to-r from-primary to-accent'
                : 'bg-gradient-to-r from-primary-soft to-tertiary',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onDecrement}
          disabled={entry.count <= 0}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
        >
          <Minus className="size-3" />
          {t('undo')}
        </button>

        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              defaultValue={entry.target}
              onBlur={(e) => {
                onTargetChange(Math.max(0, Number(e.target.value) || 0));
                onEditTarget();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onTargetChange(Math.max(0, Number((e.target as HTMLInputElement).value) || 0));
                  onEditTarget();
                }
              }}
              autoFocus
              className="w-16 rounded-md border border-border bg-background px-2 py-1 text-center text-xs tabular-nums"
            />
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {t('target')}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onEditTarget}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('edit_target')}
          </button>
        )}
      </div>
    </div>
  );
}
