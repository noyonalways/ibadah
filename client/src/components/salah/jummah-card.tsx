'use client';

import { useTranslations } from 'next-intl';
import {
  BookOpen,
  Clock,
  Droplets,
  Mic,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JummahEntry, PrayerStatus } from '@/lib/salah/salah-api';
import type { SalahScoring } from '@/lib/user/user-api';
import { SunnahNaflToggles } from '@/components/salah/sunnah-nafl-toggles';

const STATUS_OPTIONS: {
  value: PrayerStatus;
  labelKey: string;
}[] = [
  { value: 'on_time_awwal', labelKey: 'status_jummah_with_imam' },
  { value: 'on_time_last', labelKey: 'status_jummah_late' },
  { value: 'late', labelKey: 'status_jummah_qaza' },
  { value: 'missed', labelKey: 'status_missed' },
];

const FLAGS: {
  key: 'khutbah' | 'earlyArrival' | 'surahKahf' | 'ghusl';
  labelKey: string;
  scoringKey: 'jummahKhutbah' | 'jummahEarly' | 'jummahSurahKahf' | 'jummahGhusl';
  icon: LucideIcon;
}[] = [
  { key: 'khutbah', labelKey: 'jummah_khutbah', scoringKey: 'jummahKhutbah', icon: Mic },
  { key: 'earlyArrival', labelKey: 'jummah_early', scoringKey: 'jummahEarly', icon: Clock },
  { key: 'surahKahf', labelKey: 'jummah_surah_kahf', scoringKey: 'jummahSurahKahf', icon: BookOpen },
  { key: 'ghusl', labelKey: 'jummah_ghusl', scoringKey: 'jummahGhusl', icon: Droplets },
];

interface Props {
  entry: JummahEntry;
  scoring: SalahScoring;
  onChange: (patch: Partial<JummahEntry>) => void;
  disabled?: boolean;
}

/**
 * Friday Jummah card — visually distinct from regular waqt cards. The
 * Fard timing reuses the existing PrayerStatus enum but only exposes
 * the buckets that make sense for Jummah ("with the Imam" / "late but
 * caught Salat-ul-Asr" / "qaza" / "missed"). The Khutbah/early/Kahf/
 * Ghusl flags sit on a dedicated row above the standard sunnah/nafl
 * toggles, since they carry their own (and larger) point values.
 *
 * The Jummah Fard reward is `scoring.jummahFard`, regardless of which
 * timing bucket the user picks — the timing label just lets the user
 * record context. The scoring code on the server uses the Jummah-Fard
 * value for any non-pending non-late non-missed status.
 */
export function JummahCard({ entry, scoring, onChange, disabled }: Props) {
  const t = useTranslations('Salah');

  return (
    <div className="group relative col-span-full overflow-hidden rounded-2xl border border-accent/40 bg-card shadow-sm transition-all hover:shadow-lg hover:shadow-accent/15">
      {/* Hero band — gold gradient + minaret silhouette. */}
      <div className="relative h-32 px-6 py-5 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-800 to-amber-700" />
        <div
          className="absolute inset-0 opacity-25"
          aria-hidden
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.45) 0px, transparent 1.5px), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.25) 0px, transparent 1.5px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div
          className="absolute -bottom-16 -right-12 size-44 rounded-full bg-white/15 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden
        />

        <div className="relative flex h-full items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] opacity-80">
              {t('friday_short')}
            </p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight">{t('jummah')}</h3>
            <p className="mt-1 text-xs opacity-85">{t('jummah_replaces_dhuhr')}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.18em] opacity-80">{t('fard')}</p>
            <p className="mt-1 text-3xl font-bold leading-none tabular-nums">
              {scoring.jummahFard > 0 ? '+' : ''}
              {scoring.jummahFard}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] opacity-75">
              {t('jummah_fard_label')}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {/* Fard timing — only the Jummah-relevant buckets */}
        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {t('jummah_fard_status')}
          </p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const active = entry.fard.status === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    onChange({
                      fard: { status: active ? 'pending' : opt.value },
                    })
                  }
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 ring-inset transition-all',
                    active
                      ? 'bg-foreground text-background ring-foreground shadow-sm'
                      : 'bg-muted/60 text-muted-foreground ring-transparent hover:bg-muted hover:text-foreground hover:ring-border',
                    opt.value === 'missed' &&
                      active &&
                      'bg-destructive ring-destructive text-destructive-foreground',
                  )}
                  aria-pressed={active}
                >
                  {t(opt.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Friday-specific flags */}
        <div className="border-t border-border/40 pt-4">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {t('jummah_extras')}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {FLAGS.map((f) => {
              const active = entry[f.key];
              const points = scoring[f.scoringKey];
              const Icon = f.icon;
              return (
                <button
                  key={f.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ [f.key]: !active } as Partial<JummahEntry>)}
                  className={cn(
                    'group/flag flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-all',
                    active
                      ? 'border-accent/50 bg-gradient-to-br from-accent/15 via-card to-card shadow-sm shadow-accent/10'
                      : 'border-border/60 bg-card hover:border-accent/30',
                  )}
                  aria-pressed={active}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={cn(
                        'grid size-8 place-items-center rounded-lg transition-colors',
                        active
                          ? 'bg-gradient-to-br from-accent to-accent-deep text-accent-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="truncate text-sm font-medium">
                      {t(f.labelKey)}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ring-1 ring-inset',
                      active
                        ? 'bg-accent/30 text-accent-foreground ring-accent/40'
                        : 'bg-background text-muted-foreground ring-border',
                    )}
                  >
                    {points > 0 ? '+' : ''}
                    {points}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Standard sunnah/nafl row, shared with PrayerCard. Jummah
            uses its own rakah schema (4 before + 4 after). */}
        <SunnahNaflToggles
          jummah
          entry={entry}
          scoring={scoring}
          onChange={onChange as (p: Partial<JummahEntry>) => void}
          disabled={disabled}
          Icon={Sparkles}
        />
      </div>
    </div>
  );
}
