'use client';

import { useEffect, useState } from 'react';
import { Loader2, RotateCcw, Save, ShieldCheck, User } from 'lucide-react';
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

const SCORING_FIELDS: { key: keyof Scoring; label: string; help: string }[] = [
  { key: 'onTimeAwwal', label: 'On time — Awwal', help: 'Earliest part of the window' },
  { key: 'onTimeMid', label: 'On time — Mid', help: 'Middle of the window' },
  { key: 'onTimeLast', label: 'On time — Last', help: 'Last part of the window' },
  { key: 'missed', label: 'Missed', help: 'Prayer not performed' },
  { key: 'sunnahNafil', label: 'Sunnah / Nafil bonus', help: 'Per prayer where performed' },
  { key: 'witr', label: 'Witr bonus', help: 'For performing Witr' },
];

type Scoring = {
  onTimeAwwal: number;
  onTimeMid: number;
  onTimeLast: number;
  late: number;
  missed: number;
  sunnahNafil: number;
  witr: number;
};

export default function SettingsPage() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const resetScoring = useResetScoring();

  const [name, setName] = useState('');
  const [locale, setLocale] = useState<'en' | 'bn' | 'ar'>('en');
  const [timezone, setTimezone] = useState('UTC');
  const [scoring, setScoring] = useState<Scoring | null>(null);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setLocale(profile.locale ?? 'en');
    setTimezone(profile.timezone ?? 'UTC');
    setScoring(profile.scoring as Scoring);
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
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Could not update');
    }
  };

  const saveScoring = async () => {
    if (!scoring) return;
    try {
      // Server's scoring schema does not currently accept `late`; everything else passes through.
      const { late: _late, ...scoringWithoutLate } = scoring;
      await updateProfile.mutateAsync({ scoring: scoringWithoutLate });
      toast.success('Scoring saved');
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Could not save scoring');
    }
  };

  const onResetScoring = async () => {
    try {
      const data = await resetScoring.mutateAsync();
      setScoring(data.scoring as Scoring);
      toast.success('Scoring reset to defaults');
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Could not reset');
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
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Personalize Ibadah to fit your journey."
      />

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
              Member since {memberSince}
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
              <CardTitle className="text-base">Profile</CardTitle>
              <CardDescription>Display name and localization preferences.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile.email} disabled />
            </div>
            <div>
              <Label htmlFor="locale">Language</Label>
              <Select
                id="locale"
                value={locale}
                onChange={(e) => setLocale(e.target.value as typeof locale)}
              >
                <option value="en">English</option>
                <option value="bn">বাংলা (Bangla)</option>
                <option value="ar">العربية (Arabic)</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. Asia/Dhaka, UTC, America/New_York"
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
              Save profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ------ Appearance section ------ */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Switch between light and dark theme.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Theme</p>
          <ThemeToggle />
        </CardContent>
      </Card>

      {/* ------ Salah scoring ------ */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-accent/30 text-accent-foreground">
                <ShieldCheck className="size-4" />
              </span>
              <div>
                <CardTitle className="text-base">Salah scoring</CardTitle>
                <CardDescription>
                  Customize the points awarded for each prayer outcome.
                </CardDescription>
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
              Reset to defaults
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {SCORING_FIELDS.map((f) => (
              <div key={f.key}>
                <Label htmlFor={`scoring-${f.key}`}>{f.label}</Label>
                <Input
                  id={`scoring-${f.key}`}
                  type="number"
                  value={scoring[f.key]}
                  onChange={(e) =>
                    setScoring({
                      ...scoring,
                      [f.key]: Number(e.target.value) || 0,
                    })
                  }
                />
                <p className="mt-1 text-[11px] text-muted-foreground">{f.help}</p>
              </div>
            ))}
          </div>

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
              Save scoring
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
