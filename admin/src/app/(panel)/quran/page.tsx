'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BookOpen, Clock, Loader2, Save } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { quranApi, type QuranDay } from '@/lib/admin-api';
import { ApiClientError } from '@/lib/api';
import { toDayKey } from '@/lib/utils';

export default function QuranAdminPage() {
  const [date, setDate] = useState(toDayKey(new Date()));
  const [form, setForm] = useState<Partial<QuranDay>>({
    pagesRead: 0,
    minutesRead: 0,
    notes: '',
  });
  const qc = useQueryClient();

  const day = useQuery({
    queryKey: ['admin', 'quran', date],
    queryFn: () => quranApi.getDay(date),
  });

  // Sync local form whenever the query lands on a new day.
  useEffect(() => {
    if (day.data) {
      setForm({
        pagesRead: day.data.pagesRead ?? 0,
        minutesRead: day.data.minutesRead ?? 0,
        surahFrom: day.data.surahFrom,
        ayahFrom: day.data.ayahFrom,
        surahTo: day.data.surahTo,
        ayahTo: day.data.ayahTo,
        notes: day.data.notes ?? '',
      });
    }
  }, [day.data]);

  const save = useMutation({
    mutationFn: () => quranApi.upsertDay(date, form),
    onSuccess: (data) => {
      qc.setQueryData(['admin', 'quran', date], data);
      toast.success('Saved');
    },
    onError: (e) => toast.error(e instanceof ApiClientError ? e.message : 'Save failed'),
  });

  const set = <K extends keyof QuranDay>(key: K, value: QuranDay[K] | undefined) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Quran"
        description="Edit the daily reading log: pages, minutes, and the ayah range."
        actions={
          <div className="flex items-center gap-2">
            <Label htmlFor="quran-date" className="text-xs text-muted-foreground">
              Date
            </Label>
            <Input
              id="quran-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || toDayKey(new Date()))}
              className="w-[160px]"
            />
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" /> Reading log · {date}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <NumberField
              label="Pages read"
              value={form.pagesRead ?? 0}
              onChange={(v) => set('pagesRead', v)}
            />
            <NumberField
              label="Minutes read"
              value={form.minutesRead ?? 0}
              onChange={(v) => set('minutesRead', v)}
              icon={Clock}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <NumberField
              label="Surah from"
              value={form.surahFrom ?? 0}
              onChange={(v) => set('surahFrom', v || undefined)}
            />
            <NumberField
              label="Ayah from"
              value={form.ayahFrom ?? 0}
              onChange={(v) => set('ayahFrom', v || undefined)}
            />
            <NumberField
              label="Surah to"
              value={form.surahTo ?? 0}
              onChange={(v) => set('surahTo', v || undefined)}
            />
            <NumberField
              label="Ayah to"
              value={form.ayahTo ?? 0}
              onChange={(v) => set('ayahTo', v || undefined)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quran-notes">Notes</Label>
            <textarea
              id="quran-notes"
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background p-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
              placeholder="Reflections, tafsir notes, or topics to revisit…"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            {save.isPending && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Saving…
              </span>
            )}
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-1.5">
              <Save className="size-4" />
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function NumberField({
  label,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  icon?: typeof Clock;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5">
        {Icon && <Icon className="size-3.5 text-muted-foreground" />}
        {label}
      </Label>
      <Input
        type="number"
        min={0}
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="tabular-nums"
      />
    </div>
  );
}
