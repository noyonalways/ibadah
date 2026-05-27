'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, RotateCcw } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { RequiresAdminApi } from '@/components/admin/requires-admin-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { salahApi, type PrayerStatus, type SalahDay } from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';
import { toDayKey } from '@/lib/utils';

const PRAYERS: ('fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha')[] = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

const STATUS_OPTIONS: { value: PrayerStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'on_time_awwal', label: 'On time (Awwal)' },
  { value: 'on_time_mid', label: 'On time (Mid)' },
  { value: 'on_time_last', label: 'On time (Last)' },
  { value: 'late', label: 'Late / Qaza' },
  { value: 'missed', label: 'Missed' },
];

export default function SalahAdminPage() {
  const [date, setDate] = useState(toDayKey(new Date()));
  const qc = useQueryClient();

  const day = useQuery({
    queryKey: ['admin', 'salah', date],
    queryFn: () => salahApi.getDay(date),
  });

  const update = useMutation({
    mutationFn: (body: Partial<SalahDay>) => salahApi.upsertDay(date, body),
    onSuccess: (data) => {
      qc.setQueryData(['admin', 'salah', date], data);
      toast.success('Saved');
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : 'Save failed');
    },
  });

  const data = day.data;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Salah"
        description="Inspect and edit prayer entries for a given day."
        actions={
          <div className="flex items-center gap-2">
            <Label htmlFor="salah-date" className="text-xs text-muted-foreground">
              Date
            </Label>
            <Input
              id="salah-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || toDayKey(new Date()))}
              className="w-[160px]"
            />
          </div>
        }
      />

      <RequiresAdminApi
        title="Cross-user salah inspection"
        description="Today this page edits the operator's own salah entries. Once the endpoints below land, an additional user picker will appear at the top of the page."
        endpoints={[
          { method: 'GET', path: '/admin/users/:id/salah/:date' },
          { method: 'PUT', path: '/admin/users/:id/salah/:date', note: 'override on behalf of user' },
        ]}
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>{date}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {data?.isFriday ? 'Friday — Jummah replaces Dhuhr' : 'Regular weekday'} ·{' '}
              <span className="font-medium">{data?.totalPoints ?? 0}</span> points
            </p>
          </div>
          <Badge variant={data?.isFriday ? 'accent' : 'outline'}>
            {data?.isFriday ? 'Jummah' : 'Weekday'}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          {day.isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading day…
            </div>
          )}

          {data && (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                {PRAYERS.map((p) => (
                  <PrayerRow
                    key={p}
                    name={p}
                    entry={data.prayers[p]}
                    onChange={(patch) =>
                      update.mutate({
                        prayers: { ...data.prayers, [p]: { ...data.prayers[p], ...patch } },
                      })
                    }
                  />
                ))}
              </div>

              {/* Witr toggle */}
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4">
                <div>
                  <p className="text-sm font-medium">Witr</p>
                  <p className="text-xs text-muted-foreground">
                    The standalone post-Isha prayer.
                  </p>
                </div>
                <ToggleSwitch
                  checked={data.witr}
                  onChange={(v) => update.mutate({ witr: v })}
                  ariaLabel="Toggle Witr"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => day.refetch()}
                  className="gap-1.5"
                >
                  <RotateCcw className="size-3.5" /> Reload
                </Button>
                {update.isPending && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" /> Saving…
                  </span>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function PrayerRow({
  name,
  entry,
  onChange,
}: {
  name: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  entry: { fard: { status: PrayerStatus }; sunnahBefore: boolean; sunnahAfter: boolean; nafl: boolean };
  onChange: (patch: Partial<typeof entry>) => void;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium capitalize">{name}</p>
        <Badge variant={entry.fard.status === 'pending' ? 'outline' : 'default'} className="text-[10px]">
          {entry.fard.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      <div className="space-y-2">
        <Select
          value={entry.fard.status}
          onChange={(e) =>
            onChange({ fard: { status: e.target.value as PrayerStatus } })
          }
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>

        <div className="flex flex-wrap gap-2">
          <Toggle
            label="Sunnah before"
            checked={entry.sunnahBefore}
            onChange={(v) => onChange({ sunnahBefore: v })}
          />
          <Toggle
            label="Sunnah after"
            checked={entry.sunnahAfter}
            onChange={(v) => onChange({ sunnahAfter: v })}
          />
          <Toggle label="Nafl" checked={entry.nafl} onChange={(v) => onChange({ nafl: v })} />
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        checked
          ? 'border-primary/30 bg-primary/15 text-primary'
          : 'border-border/60 text-muted-foreground hover:bg-muted/60'
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${checked ? 'bg-primary' : 'bg-muted-foreground/40'}`}
      />
      {label}
    </button>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <span
        className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
