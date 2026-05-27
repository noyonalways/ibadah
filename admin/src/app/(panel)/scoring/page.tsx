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
    description:
      'Sunnah-before / sunnah-after are stored as points PER RAKAH and multiplied by the per-prayer rakah counts mandated by tradition (Fajr 2 / Dhuhr 4+2 / Asr 4 / Maghrib 0+2 / Isha 4+2; Jummah 4+4). Nafl is a flat per-toggle reward.',
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
  sunnahBefore: 'Sunnah before — per rakah',
  sunnahAfter: 'Sunnah after — per rakah',
  nafl: 'Nafl — flat per prayer',
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
        <>
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

          {/* Per-prayer sunnah rakah preview — shows the live multiplication
              between the per-rakah scoring values and the rakah counts
              defined on the server (PRAYER_SUNNAH_RAKAH / JUMMAH_SUNNAH_RAKAH).
              Operators see immediately how the abstract per-rakah numbers
              translate into per-prayer rewards before saving. */}
          <SunnahRakahPreview
            sunnahBefore={draft.sunnahBefore}
            sunnahAfter={draft.sunnahAfter}
          />
        </>
      )}
    </>
  );
}

/**
 * Hard-coded mirror of `server/src/modules/salah/salah.constants.ts:
 * PRAYER_SUNNAH_RAKAH`. The rakah counts themselves are fixed by Hanafi
 * tradition — only the per-rakah point value is tunable.
 */
const PRAYER_RAKAH = [
  { name: 'Fajr',    before: 2, after: 0 },
  { name: 'Dhuhr',   before: 4, after: 2 },
  { name: 'Asr',     before: 4, after: 0 },
  { name: 'Maghrib', before: 0, after: 2 },
  { name: 'Isha',    before: 4, after: 2 },
] as const;
const JUMMAH_RAKAH = { before: 4, after: 4 } as const;

function SunnahRakahPreview({
  sunnahBefore,
  sunnahAfter,
}: {
  sunnahBefore: number;
  sunnahAfter: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Per-prayer sunnah preview</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">
          The rakah counts below come from Hanafi tradition and are fixed.
          Each cell shows {' '}
          <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
            rakah × per-rakah pts
          </code>{' '}
          so you can see the live impact of your scoring values.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-[100px_1fr_1fr] gap-2 border-b border-border/50 pb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <span>Prayer</span>
          <span>Sunnah before</span>
          <span>Sunnah after</span>
        </div>
        {PRAYER_RAKAH.map((p) => (
          <RakahRow
            key={p.name}
            name={p.name}
            before={p.before}
            after={p.after}
            beforePts={sunnahBefore}
            afterPts={sunnahAfter}
          />
        ))}
        <RakahRow
          name="Jummah"
          before={JUMMAH_RAKAH.before}
          after={JUMMAH_RAKAH.after}
          beforePts={sunnahBefore}
          afterPts={sunnahAfter}
          accent
        />
      </CardContent>
    </Card>
  );
}

function RakahRow({
  name,
  before,
  after,
  beforePts,
  afterPts,
  accent,
}: {
  name: string;
  before: number;
  after: number;
  beforePts: number;
  afterPts: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[100px_1fr_1fr] items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
        accent ? 'bg-accent/10 ring-1 ring-inset ring-accent/30' : ''
      }`}
    >
      <span className="font-medium">{name}</span>
      <RakahCell rakah={before} pts={beforePts} />
      <RakahCell rakah={after} pts={afterPts} />
    </div>
  );
}

function RakahCell({ rakah, pts }: { rakah: number; pts: number }) {
  if (rakah === 0) {
    return (
      <span className="text-xs italic text-muted-foreground/60">
        not applicable
      </span>
    );
  }
  const total = rakah * pts;
  return (
    <span className="font-mono text-xs tabular-nums">
      {rakah} rakah × {pts} ={' '}
      <span className="font-semibold text-foreground">
        {total > 0 ? '+' : ''}
        {total}
      </span>
    </span>
  );
}
