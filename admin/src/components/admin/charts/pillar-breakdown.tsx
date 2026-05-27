'use client';

import type { LucideIcon } from 'lucide-react';
import { BookOpen, HandHeart, Heart, ListChecks, ListTodo } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  AnalyticsPillars,
  ChecklistPillarStats,
  DhikrPillarStats,
  HabitsPillarStats,
  QuranPillarStats,
  SalahPillarStats,
} from '@/lib/admin-api';

interface CardData {
  icon: LucideIcon;
  title: string;
  primary: string;
  primaryLabel: string;
  rows: { label: string; value: string }[];
  tone: 'primary' | 'accent' | 'tertiary' | 'destructive';
}

const fmt = (n: number) => n.toLocaleString();
const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : '—');


function salahCard(p: SalahPillarStats): CardData {
  const totalLogged =
    p.statusCounts.on_time_awwal +
    p.statusCounts.on_time_mid +
    p.statusCounts.on_time_last +
    p.statusCounts.late +
    p.statusCounts.missed;
  const onTime =
    p.statusCounts.on_time_awwal + p.statusCounts.on_time_mid + p.statusCounts.on_time_last;
  return {
    icon: Heart,
    title: 'Salah',
    primary: fmt(p.totalPoints),
    primaryLabel: 'points logged',
    rows: [
      { label: 'Days logged', value: fmt(p.totalDays) },
      { label: 'On-time rate', value: pct(onTime, totalLogged) },
      { label: 'Missed prayers', value: fmt(p.statusCounts.missed) },
      { label: 'Sunnah counted', value: fmt(p.sunnahCount) },
      { label: 'Nafl counted', value: fmt(p.naflCount) },
      { label: 'Witr days', value: fmt(p.witrCount) },
      { label: 'Jummah logged', value: fmt(p.jummahCount) },
    ],
    tone: 'primary',
  };
}

function quranCard(p: QuranPillarStats): CardData {
  return {
    icon: BookOpen,
    title: 'Quran',
    primary: fmt(p.totalPages),
    primaryLabel: 'pages read',
    rows: [
      { label: 'Days logged', value: fmt(p.totalDays) },
      { label: 'Total minutes', value: fmt(p.totalMinutes) },
      {
        label: 'Avg pages / day',
        value: p.totalDays > 0 ? (p.totalPages / p.totalDays).toFixed(1) : '—',
      },
    ],
    tone: 'accent',
  };
}

function habitsCard(p: HabitsPillarStats): CardData {
  return {
    icon: ListChecks,
    title: 'Habits',
    primary: fmt(p.completionsCount),
    primaryLabel: 'completions',
    rows: [
      { label: 'Days logged', value: fmt(p.totalDays) },
      { label: 'Completion rate', value: pct(p.completionsCount, p.totalEntries) },
      { label: 'Total entries', value: fmt(p.totalEntries) },
      { label: 'Total points', value: fmt(p.totalPoints) },
      ...(p.definitionsCount !== undefined
        ? [{ label: 'Definitions', value: fmt(p.definitionsCount) }]
        : []),
    ],
    tone: 'tertiary',
  };
}

function checklistCard(p: ChecklistPillarStats): CardData {
  return {
    icon: ListTodo,
    title: 'Checklist',
    primary: fmt(p.itemsCompleted),
    primaryLabel: 'items completed',
    rows: [
      { label: 'Days logged', value: fmt(p.totalDays) },
      { label: 'Completion rate', value: pct(p.itemsCompleted, p.itemsTotal) },
      { label: 'Total items', value: fmt(p.itemsTotal) },
      { label: 'Total points', value: fmt(p.totalPoints) },
    ],
    tone: 'primary',
  };
}

function dhikrCard(p: DhikrPillarStats): CardData {
  const top = p.byPreset[0];
  return {
    icon: HandHeart,
    title: 'Dhikr',
    primary: fmt(p.totalCount),
    primaryLabel: 'recitations',
    rows: [
      { label: 'Days logged', value: fmt(p.totalDays) },
      { label: 'Distinct presets', value: fmt(p.byPreset.length) },
      { label: 'Top preset', value: top ? `${top.label} (${fmt(top.count)})` : '—' },
    ],
    tone: 'accent',
  };
}

const TONES: Record<CardData['tone'], { card: string; iconBg: string; iconText: string }> = {
  primary: {
    card: 'from-primary/10 via-card to-card',
    iconBg: 'bg-primary/15',
    iconText: 'text-primary',
  },
  accent: {
    card: 'from-accent/15 via-card to-card',
    iconBg: 'bg-accent/30',
    iconText: 'text-accent-foreground',
  },
  tertiary: {
    card: 'from-tertiary/10 via-card to-card',
    iconBg: 'bg-tertiary/15',
    iconText: 'text-tertiary',
  },
  destructive: {
    card: 'from-destructive/10 via-card to-card',
    iconBg: 'bg-destructive/15',
    iconText: 'text-destructive',
  },
};

function PillarCard({ data }: { data: CardData }) {
  const Icon = data.icon;
  const tone = TONES[data.tone];
  return (
    <Card className={cn('overflow-hidden border-border/60 bg-gradient-to-br', tone.card)}>
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-3">
          <div className={cn('grid size-10 place-items-center rounded-xl', tone.iconBg, tone.iconText)}>
            <Icon className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {data.title}
            </p>
            <p className="font-display text-2xl font-bold tabular-nums leading-none">
              {data.primary}
            </p>
            <p className="text-[11px] text-muted-foreground">{data.primaryLabel}</p>
          </div>
        </div>
        <ul className="space-y-1.5 border-t border-border/40 pt-3 text-xs">
          {data.rows.map((r) => (
            <li key={r.label} className="flex items-baseline justify-between">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-medium tabular-nums">{r.value}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function PillarBreakdown({ pillars }: { pillars: AnalyticsPillars }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <PillarCard data={salahCard(pillars.salah)} />
      <PillarCard data={quranCard(pillars.quran)} />
      <PillarCard data={habitsCard(pillars.habits)} />
      <PillarCard data={checklistCard(pillars.checklist)} />
      <PillarCard data={dhikrCard(pillars.dhikr)} />
    </div>
  );
}
