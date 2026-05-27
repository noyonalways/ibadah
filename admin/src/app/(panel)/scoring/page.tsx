'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, RotateCcw, Save } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { profileApi, type ScoringConfig } from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';

/**
 * Logical groupings shown in the UI. Mirrors server/src/modules/salah/salah.constants.ts.
 */
const GROUPS: { title: string; description: string; keys: (keyof ScoringConfig)[] }[] = [
  {
    title: 'Fard timing',
    description: 'Reward based on which third of the prayer window the Fard was performed in.',
    keys: ['fardAwwal', 'fardMid', 'fardLast', 'fardLate', 'fardMissed'],
  },
  {
    title: 'Sunnah & Nafl',
    description: 'Independent flags layered on top of any waqt prayer.',
    keys: ['sunnahBefore', 'sunnahAfter', 'nafl'],
  },
  {
    title: 'Witr',
    description: 'The standalone post-Isha pillar.',
    keys: ['witr'],
  },
  {
    title: 'Jummah (Friday)',
    description: 'Replaces Dhuhr on Fridays. Layered flags reward the wider Jummah etiquette.',
    keys: [
      'jummahFard',
      'jummahKhutbah',
      'jummahEarly',
      'jummahSurahKahf',
      'jummahGhusl',
    ],
  },
];

const LABELS: Record<keyof ScoringConfig, string> = {
  fardAwwal: 'Fard — Awwal Waqt',
  fardMid: 'Fard — middle of window',
  fardLast: 'Fard — last of window',
  fardLate: 'Fard — late / Qaza',
  fardMissed: 'Fard — missed',
  sunnahBefore: 'Sunnah before',
  sunnahAfter: 'Sunnah after',
  nafl: 'Nafl',
  witr: 'Witr',
  jummahFard: 'Jummah — Fard with Imam',
  jummahKhutbah: 'Jummah — Khutbah attended',
  jummahEarly: 'Jummah — early arrival',
  jummahSurahKahf: 'Jummah — Surah Al-Kahf',
  jummahGhusl: 'Jummah — Ghusl',
};

export default function ScoringAdminPage() {
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ['admin', 'profile'], queryFn: profileApi.get });

  const [draft, setDraft] = useState<ScoringConfig | null>(null);

  // Sync local draft when the profile fetches.
  useEffect(() => {
    if (profile.data) setDraft({ ...profile.data.scoring });
  }, [profile.data]);

  const save = useMutation({
    mutationFn: (body: Partial<ScoringConfig>) => profileApi.updateScoring(body),
    onSuccess: (data) => {
      qc.setQueryData(['admin', 'profile'], data);
      toast.success('Scoring saved');
    },
    onError: (e) => toast.error(e instanceof ApiClientError ? e.message : 'Save failed'),
  });

  const reset = useMutation({
    mutationFn: () => profileApi.resetScoring(),
    onSuccess: (data) => {
      qc.setQueryData(['admin', 'profile'], data);
      setDraft({ ...data.scoring });
      toast.success('Reset to defaults');
    },
  });

  const dirty =
    draft && profile.data
      ? Object.keys(draft).some(
          (k) =>
            draft[k as keyof ScoringConfig] !==
            profile.data!.scoring[k as keyof ScoringConfig],
        )
      : false;

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="Scoring"
        description="Tune the salah point values used to compute every daily total. These are the operator's overrides on top of the server's defaults."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => reset.mutate()}
              disabled={reset.isPending}
              className="gap-1.5"
            >
              {reset.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RotateCcw className="size-3.5" />
              )}
              Reset to defaults
            </Button>
            <Button
              size="sm"
              onClick={() => draft && save.mutate(draft)}
              disabled={!draft || !dirty || save.isPending}
              className="gap-1.5"
            >
              {save.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Save
            </Button>
          </div>
        }
      />

      {profile.isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading scoring config…
        </div>
      )}

      {draft && (
        <div className="grid gap-4 lg:grid-cols-2">
          {GROUPS.map((group) => (
            <Card key={group.title}>
              <CardHeader>
                <CardTitle>{group.title}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">{group.description}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.keys.map((k) => (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <Label htmlFor={`s-${k}`} className="text-xs">
                      {LABELS[k]}
                    </Label>
                    <Input
                      id={`s-${k}`}
                      type="number"
                      value={draft[k]}
                      onChange={(e) =>
                        setDraft((d) =>
                          d ? { ...d, [k]: Number(e.target.value) || 0 } : d,
                        )
                      }
                      className="h-9 w-24 text-right tabular-nums"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
