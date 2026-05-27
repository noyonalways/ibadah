'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BookOpen,
  Clock,
  Droplets,
  Loader2,
  Mic,
  Moon,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useProfile, useResetScoring, useUpdateProfile } from '@/hooks/use-user';
import { ApiClientError } from '@/lib/api';
import { GeometricPattern } from '@/components/shared/geometric-pattern';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { ChecklistTemplateSection } from '@/components/settings/checklist-template-section';
import { HabitsShortcutSection } from '@/components/settings/habits-shortcut-section';
import type { SalahScoring } from '@/lib/user-api';

/* ------------------------------------------------------------------ *
 * Scoring fields — grouped into 4 sections so the form scans cleanly  *
 * even though we now expose ~14 editable values.                       *
 * ------------------------------------------------------------------ */

type ScoringKey = keyof SalahScoring;

interface ScoringField {
  key: ScoringKey;
  labelKey: string;
  helpKey: string;
}

interface ScoringGroup {
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  fields: ScoringField[];
}

const SCORING_GROUPS: ScoringGroup[] = [
  {
    titleKey: 'scoring_group_fard_title',
    descKey: 'scoring_group_fard_desc',
    icon: Sun,
    fields: [
      { key: 'fardAwwal', labelKey: 'scoring_field_awwal', helpKey: 'scoring_field_awwal_help' },
      { key: 'fardMid', labelKey: 'scoring_field_mid', helpKey: 'scoring_field_mid_help' },
      { key: 'fardLast', labelKey: 'scoring_field_last', helpKey: 'scoring_field_last_help' },
      { key: 'fardLate', labelKey: 'scoring_field_late', helpKey: 'scoring_field_late_help' },
      { key: 'fardMissed', labelKey: 'scoring_field_missed', helpKey: 'scoring_field_missed_help' },
    ],
  },
  {
    titleKey: 'scoring_group_sunnah_title',
    descKey: 'scoring_group_sunnah_desc',
    icon: Sparkles,
    fields: [
      {
        key: 'sunnahBefore',
        labelKey: 'scoring_field_sunnah_before',
        helpKey: 'scoring_field_sunnah_before_help',
      },
      {
        key: 'sunnahAfter',
        labelKey: 'scoring_field_sunnah_after',
        helpKey: 'scoring_field_sunnah_after_help',
      },
      { key: 'nafl', labelKey: 'scoring_field_nafl', helpKey: 'scoring_field_nafl_help' },
    ],
  },
  {
    titleKey: 'scoring_group_witr_title',
    descKey: 'scoring_group_witr_desc',
    icon: Moon,
    fields: [{ key: 'witr', labelKey: 'scoring_field_witr', helpKey: 'scoring_field_witr_help' }],
  },
  {
    titleKey: 'scoring_group_jummah_title',
    descKey: 'scoring_group_jummah_desc',
    icon: Mic,
    fields: [
      {
        key: 'jummahFard',
        labelKey: 'scoring_field_jummah_fard',
        helpKey: 'scoring_field_jummah_fard_help',
      },
      {
        key: 'jummahKhutbah',
        labelKey: 'scoring_field_jummah_khutbah',
        helpKey: 'scoring_field_jummah_khutbah_help',
      },
      {
        key: 'jummahEarly',
        labelKey: 'scoring_field_jummah_early',
        helpKey: 'scoring_field_jummah_early_help',
      },
      {
        key: 'jummahSurahKahf',
        labelKey: 'scoring_field_jummah_kahf',
        helpKey: 'scoring_field_jummah_kahf_help',
      },
      {
        key: 'jummahGhusl',
        labelKey: 'scoring_field_jummah_ghusl',
        helpKey: 'scoring_field_jummah_ghusl_help',
      },
    ],
  },
];

// Per-field icons inside the Jummah group, since they correspond to the
// concrete worship moments (Khutbah / arriving early / Surah Al-Kahf / Ghusl).
const JUMMAH_ICONS: Partial<Record<ScoringKey, LucideIcon>> = {
  jummahKhutbah: Mic,
  jummahEarly: Clock,
  jummahSurahKahf: BookOpen,
  jummahGhusl: Droplets,
};

export default function SettingsPage() {
  const t = useTranslations('Settings');
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const resetScoring = useResetScoring();

  const [name, setName] = useState('');
  const [locale, setLocale] = useState<'en' | 'bn' | 'ar'>('en');
  const [timezone, setTimezone] = useState('UTC');
  const [scoring, setScoring] = useState<SalahScoring | null>(null);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setLocale(profile.locale ?? 'en');
    setTimezone(profile.timezone ?? 'UTC');
    setScoring(profile.scoring);
  }, [profile]);

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const initials =
    profile?.name
      ?.split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '?';

  const saveProfile = async () => {
    try {
      await updateProfile.mutateAsync({ name, locale, timezone });
      toast.success(t('profile_saved'));
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : t('profile_error'));
    }
  };

  const saveScoring = async () => {
    if (!scoring) return;
    try {
      await updateProfile.mutateAsync({ scoring });
      toast.success(t('scoring_saved'));
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : t('scoring_error'));
    }
  };

  const onResetScoring = async () => {
    try {
      const data = await resetScoring.mutateAsync();
      setScoring(data.scoring);
      toast.success(t('scoring_reset_done'));
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : t('scoring_error'));
    }
  };

  if (isLoading || !profile || !scoring) {
    return (
      <div className="grid place-items-center py-20 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      {/* ------ Profile hero ------ */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/5 p-6 md:p-8">
        <GeometricPattern className="text-primary" opacity={0.05} />
        <div
          className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-primary/15 blur-3xl"
          aria-hidden
        />
        <div className="relative flex items-center gap-5">
          <span className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-primary via-primary-soft to-accent-deep text-2xl font-semibold text-primary-foreground shadow-md">
            {initials}
          </span>
          <div>
            <p className="text-2xl font-bold tracking-tight">{profile.name}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
              {t('member_since', { date: memberSince })}
            </p>
          </div>
        </div>
      </div>

      {/* ------ Profile section ------ */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <User className="size-4" />
            </span>
            <div>
              <CardTitle className="text-base">{t('profile_section')}</CardTitle>
              <CardDescription>{t('profile_desc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">{t('full_name')}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">{t('email')}</Label>
              <Input id="email" value={profile.email} disabled />
            </div>
            <div>
              <Label htmlFor="locale">{t('language')}</Label>
              <Select
                id="locale"
                value={locale}
                onChange={(e) => setLocale(e.target.value as typeof locale)}
              >
                <option value="en">{t('language_en')}</option>
                <option value="bn">{t('language_bn')}</option>
                <option value="ar">{t('language_ar')}</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="timezone">{t('timezone')}</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder={t('timezone_placeholder')}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={saveProfile}
              disabled={updateProfile.isPending}
              className="rounded-full"
            >
              {updateProfile.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {t('save_profile')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ------ Default checklist template ------ */}
      <ChecklistTemplateSection initial={profile.defaultChecklistItems ?? []} />

      {/* ------ Habits shortcut ------ */}
      <HabitsShortcutSection />

      {/* ------ Appearance section ------ */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">{t('appearance_section')}</CardTitle>
          <CardDescription>{t('appearance_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{t('theme')}</p>
          <ThemeToggle />
        </CardContent>
      </Card>

      {/* ------ Salah scoring (grouped) ------ */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-accent/30 text-accent-foreground">
                <ShieldCheck className="size-4" />
              </span>
              <div>
                <CardTitle className="text-base">{t('scoring_section')}</CardTitle>
                <CardDescription>{t('scoring_desc')}</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetScoring}
              disabled={resetScoring.isPending}
              className="rounded-full text-muted-foreground"
            >
              <RotateCcw className="size-3.5" />
              {t('scoring_reset')}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {SCORING_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            return (
              <section key={group.titleKey}>
                <div className="flex items-center gap-2.5">
                  <span className="grid size-7 place-items-center rounded-md bg-muted text-muted-foreground">
                    <GroupIcon className="size-3.5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight">
                      {t(group.titleKey)}
                    </h3>
                    <p className="text-xs text-muted-foreground">{t(group.descKey)}</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.fields.map((f) => {
                    const FieldIcon = JUMMAH_ICONS[f.key];
                    return (
                      <div
                        key={f.key}
                        className="rounded-xl border border-border/60 bg-background/60 p-3"
                      >
                        <div className="flex items-center gap-2">
                          {FieldIcon ? (
                            <span className="grid size-6 place-items-center rounded-md bg-accent/20 text-accent-foreground">
                              <FieldIcon className="size-3" />
                            </span>
                          ) : null}
                          <Label
                            htmlFor={`scoring-${f.key}`}
                            className="text-xs font-medium"
                          >
                            {t(f.labelKey)}
                          </Label>
                        </div>
                        <Input
                          id={`scoring-${f.key}`}
                          type="number"
                          className="mt-2"
                          value={scoring[f.key]}
                          onChange={(e) =>
                            setScoring({
                              ...scoring,
                              [f.key]: Number(e.target.value) || 0,
                            })
                          }
                        />
                        <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                          {t(f.helpKey)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <div className="flex justify-end pt-2">
            <Button
              onClick={saveScoring}
              disabled={updateProfile.isPending}
              className="rounded-full"
            >
              {updateProfile.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {t('scoring_save')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
