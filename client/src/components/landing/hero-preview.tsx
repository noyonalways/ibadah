'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, BookOpen, Flame, HeartPulse, Check, X, RotateCcw, Plus, Minus, MousePointerClick } from 'lucide-react';
import { ProgressRing } from '@/components/shared/progress-ring';
import { LandingCard } from '@/components/landing/landing-card';
import { useCurrentUser } from '@/hooks/use-auth';
import { statsApi } from '@/lib/stats/stats-api';
import { salahApi, type PrayerName, type SalahDay } from '@/lib/salah/salah-api';
import { userApi } from '@/lib/user/user-api';
import { maxDailyPoints } from '@/lib/salah-scoring';
import { SALAH_DEFAULT_SCORING } from '@/lib/salah-defaults';
import { cn, toDayKey } from '@/lib/utils';

type TabKey = 'salah' | 'dhikr' | 'quran';
type ChipState = 'done' | 'missed' | 'pending';

interface PrayerChipItem {
  name: PrayerName;
  tone: string;
  state: ChipState;
}

const PRAYER_TONES: { name: PrayerName; tone: string }[] = [
  { name: 'fajr', tone: 'bg-prayer-fajr' },
  { name: 'dhuhr', tone: 'bg-prayer-dhuhr' },
  { name: 'asr', tone: 'bg-prayer-asr' },
  { name: 'maghrib', tone: 'bg-prayer-maghrib' },
  { name: 'isha', tone: 'bg-prayer-isha' },
];

function chipState(day: SalahDay | undefined, name: PrayerName): ChipState {
  if (!day) return 'pending';
  const status =
    day.isFriday && name === 'dhuhr'
      ? day.jummah?.fard.status ?? 'pending'
      : day.prayers[name].fard.status;
  if (status === 'missed') return 'missed';
  if (status === 'pending') return 'pending';
  return 'done';
}

export function HeroPreview() {
  const { user, hasHydrated } = useCurrentUser();
  const authed = hasHydrated && !!user;
  const [activeTab, setActiveTab] = useState<TabKey>('salah');

  const today = toDayKey(new Date());
  const weekAgo = toDayKey(
    (() => {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      return d;
    })(),
  );

  const weekQ = useQuery({
    queryKey: ['stats', 'daily', weekAgo, today],
    queryFn: () => statsApi.daily(weekAgo, today),
    enabled: authed,
  });
  const streaksQ = useQuery({
    queryKey: ['stats', 'streaks'],
    queryFn: statsApi.streaks,
    enabled: authed,
  });
  const salahQ = useQuery({
    queryKey: ['salah', 'day', today],
    queryFn: () => salahApi.getDay(today),
    enabled: authed,
  });
  const profileQ = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: userApi.getMe,
    enabled: authed,
    staleTime: 30_000,
  });

  return (
    <LandingCard interactive={false} className="p-0 border border-border/50 bg-card/60 shadow-md backdrop-blur-md overflow-hidden rounded-2xl md:rounded-3xl">
      <div className="p-6 md:p-8 space-y-6">
        {/* Top Header & Tab Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1 border border-border/30">
              <button
                onClick={() => setActiveTab('salah')}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all',
                  activeTab === 'salah'
                    ? 'bg-background text-foreground shadow-xs border border-border/40'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Salah Log
              </button>
              <button
                onClick={() => setActiveTab('dhikr')}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all',
                  activeTab === 'dhikr'
                    ? 'bg-background text-foreground shadow-xs border border-border/40'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Dhikr Counter
              </button>
              <button
                onClick={() => setActiveTab('quran')}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all',
                  activeTab === 'quran'
                    ? 'bg-background text-foreground shadow-xs border border-border/40'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Quran Progress
              </button>
            </div>

            {/* Interactive hint chip */}
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium bg-muted/30 px-2.5 py-1 rounded-full border border-border/30">
              <MousePointerClick className="size-3 text-primary" />
              Interactive demo
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
            </span>
            {authed ? 'Live Data' : 'Live Preview'}
          </span>
        </div>

        {/* Dynamic Interactive Tab Views */}
        {activeTab === 'salah' && <InteractiveSalahView initialChips={PRAYER_TONES.map(p => ({ ...p, state: authed ? chipState(salahQ.data, p.name) : 'done' }))} initialStreak={streaksQ.data?.current ?? 14} />}
        {activeTab === 'dhikr' && <InteractiveDhikrView />}
        {activeTab === 'quran' && <InteractiveQuranView />}
      </div>
    </LandingCard>
  );
}

function InteractiveSalahView({ initialChips, initialStreak }: { initialChips: PrayerChipItem[]; initialStreak: number }) {
  const t = useTranslations('Landing');
  const tSalah = useTranslations('Salah');
  const [chips, setChips] = useState<PrayerChipItem[]>(initialChips);

  const toggleChip = (index: number) => {
    setChips((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        const nextState: ChipState = c.state === 'done' ? 'pending' : c.state === 'pending' ? 'missed' : 'done';
        return { ...c, state: nextState };
      }),
    );
  };

  const doneCount = chips.filter((c) => c.state === 'done').length;
  const points = doneCount * 20;
  const overallPct = Math.round((doneCount / chips.length) * 100);

  return (
    <div className="space-y-6">
      {/* Overview & Progress Ring Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center rounded-xl border border-border/40 bg-background/40 p-5">
        <div className="space-y-1 text-center md:text-left">
          <p className="text-[11px] uppercase font-semibold tracking-wider text-muted-foreground">{t('preview_today')}</p>
          <h3 className="text-lg font-bold tracking-tight">Friday, Rabi' al-Awwal</h3>
          <p className="text-xs text-muted-foreground">Click cards to toggle prayer state</p>
        </div>

        <div className="flex justify-center">
          <ProgressRing
            value={overallPct}
            max={100}
            size={120}
            thickness={8}
            label={`${overallPct}%`}
            sublabel={t('preview_overall')}
          />
        </div>

        <div className="flex flex-col items-center md:items-end justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            +{points} pts
          </span>
          <p className="text-xs text-muted-foreground font-medium">{doneCount} of {chips.length} Logged</p>
        </div>
      </div>

      {/* Full Width Interactive Prayer Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {chips.map((p, idx) => (
          <button
            key={p.name}
            onClick={() => toggleChip(idx)}
            className={cn(
              'group relative aspect-[3/4] min-w-0 overflow-hidden rounded-xl p-3.5 text-left font-bold text-white/95 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] border border-white/10 focus:outline-none',
              p.tone,
              p.state === 'pending' && 'opacity-60 grayscale-[30%]',
              p.state === 'missed' && 'opacity-80 ring-1 ring-rose-400',
              p.state === 'done' && 'ring-1 ring-white/40 shadow-xs',
            )}
          >
            {/* Status indicator icon badge */}
            <span
              className={cn(
                'absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full transition-all',
                p.state === 'done' && 'bg-white text-emerald-600 shadow-xs',
                p.state === 'missed' && 'bg-rose-500 text-white',
                p.state === 'pending' && 'bg-white/30 text-white/70',
              )}
            >
              {p.state === 'done' && <Check className="size-3 stroke-[3]" />}
              {p.state === 'missed' && <X className="size-3 stroke-[3]" />}
              {p.state === 'pending' && <span className="size-1 rounded-full bg-white/70" />}
            </span>

            <div className="absolute inset-x-0 bottom-3 px-2 text-center">
              <p className="text-xs uppercase font-extrabold tracking-wider">{tSalah(p.name)}</p>
              <p className="mt-0.5 text-[10px] font-medium opacity-80 capitalize">
                {p.state === 'done' ? 'Completed' : p.state === 'missed' ? 'Missed' : 'Tap to mark'}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Bottom Streak Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/40 bg-background/40 p-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-sm font-extrabold text-primary">
            {initialStreak}
          </span>
          <div>
            <p className="text-xs font-bold leading-tight">{t('preview_streak')}</p>
            <p className="text-[11px] text-muted-foreground">{t('preview_keep')}</p>
          </div>
        </div>

        <div className="flex gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-5 w-2 rounded-full transition-all',
                i < 5 ? 'bg-primary' : 'bg-muted/60',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function InteractiveDhikrView() {
  const DHIKR_ITEMS = [
    { phrase: 'SubhanAllah', target: 33, ar: 'سُبْحَانَ اللهِ' },
    { phrase: 'Alhamdulillah', target: 33, ar: 'الْحَمْدُ لِلَّهِ' },
    { phrase: 'Allahu Akbar', target: 34, ar: 'اللهُ أَكْبَرُ' },
  ];

  const [activePhraseIdx, setActivePhraseIdx] = useState(0);
  const [counts, setCounts] = useState([24, 33, 18]);

  const activeItem = DHIKR_ITEMS[activePhraseIdx];
  const currentCount = counts[activePhraseIdx];

  const handleIncrement = () => {
    setCounts((prev) =>
      prev.map((c, i) => {
        if (i !== activePhraseIdx) return c;
        return c >= activeItem.target ? 1 : c + 1;
      }),
    );
  };

  const handleReset = () => {
    setCounts((prev) => prev.map((c, i) => (i === activePhraseIdx ? 0 : c)));
  };

  return (
    <div className="space-y-6">
      {/* Phrase Selection Pills */}
      <div className="flex justify-center gap-2">
        {DHIKR_ITEMS.map((item, idx) => (
          <button
            key={item.phrase}
            onClick={() => setActivePhraseIdx(idx)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border',
              activePhraseIdx === idx
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border/30 bg-background/30 text-muted-foreground hover:text-foreground',
            )}
          >
            {item.phrase} ({counts[idx]}/{item.target})
          </button>
        ))}
      </div>

      {/* Main Counter Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center rounded-xl border border-border/40 bg-background/40 p-5">
        <div className="text-center md:text-left space-y-2">
          <p className="text-[11px] uppercase font-semibold tracking-wider text-muted-foreground">{activeItem.phrase}</p>
          <h2 className="text-2xl font-extrabold text-foreground">{activeItem.ar}</h2>
          <p className="text-xs text-muted-foreground">Tap the counter to increment live count.</p>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold pt-1"
          >
            <RotateCcw className="size-3.5" />
            Reset count
          </button>
        </div>

        <div className="flex flex-col items-center justify-center">
          <button
            onClick={handleIncrement}
            className="group relative flex size-32 items-center justify-center rounded-full border-2 border-primary/40 bg-card/80 shadow-xs transition-all hover:border-primary active:scale-95"
          >
            <div className="text-center">
              <span className="text-3xl font-black text-primary block">
                {currentCount}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                / {activeItem.target}
              </span>
            </div>
          </button>
          <p className="mt-2.5 text-xs text-muted-foreground font-medium">Tap to increment</p>
        </div>
      </div>
    </div>
  );
}

function InteractiveQuranView() {
  const [pagesRead, setPagesRead] = useState(14);
  const targetPages = 20;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center rounded-2xl border border-border/50 bg-background/50 p-6">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
            <BookOpen className="size-3.5" />
            Surah Al-Mulk (67) · Page 562
          </span>
          <h3 className="text-xl font-bold tracking-tight">Daily Recitation Goal</h3>
          <p className="text-xs text-muted-foreground">Track pages read and maintain your weekly Quran habit.</p>
        </div>

        {/* Counter controls */}
        <div className="flex items-center justify-center md:justify-end gap-3">
          <button
            onClick={() => setPagesRead((p) => Math.max(0, p - 1))}
            className="grid size-10 place-items-center rounded-xl border border-border bg-background hover:bg-muted font-bold shadow-sm"
          >
            <Minus className="size-4" />
          </button>
          <div className="text-center min-w-[100px]">
            <span className="text-2xl font-black text-primary">{pagesRead}</span>
            <span className="text-xs font-semibold text-muted-foreground"> / {targetPages} Pages</span>
          </div>
          <button
            onClick={() => setPagesRead((p) => Math.min(30, p + 1))}
            className="grid size-10 place-items-center rounded-xl border border-border bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-sm"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="rounded-2xl border border-border/50 bg-background/50 p-5 space-y-3">
        <div className="flex justify-between text-xs font-bold">
          <span>Weekly Completion Target</span>
          <span className="text-primary">{pagesRead} / {targetPages} Pages ({Math.round((pagesRead / targetPages) * 100)}%)</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary via-emerald-400 to-accent-deep transition-all duration-300"
            style={{ width: `${Math.min(100, Math.round((pagesRead / targetPages) * 100))}%` }}
          />
        </div>
      </div>
    </div>
  );
}
