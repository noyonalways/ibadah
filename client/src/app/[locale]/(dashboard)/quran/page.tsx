'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/dashboard/page-header';
import { DatePickerBar } from '@/components/dashboard/date-picker-bar';
import { NumberStepper } from '@/components/shared/number-stepper';
import { GeometricPattern } from '@/components/shared/geometric-pattern';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useQuranDay, useUpsertQuranDay } from '@/hooks/use-quran';
import { toDayKey } from '@/lib/utils';
import { ApiClientError } from '@/lib/api';

export default function QuranPage() {
  const [date, setDate] = useState<string>(() => toDayKey(new Date()));
  const { data, isLoading } = useQuranDay(date);
  const upsert = useUpsertQuranDay(date);

  // Local form state, synced from server data
  const [pages, setPages] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [surahFrom, setSurahFrom] = useState<string>('');
  const [ayahFrom, setAyahFrom] = useState<string>('');
  const [surahTo, setSurahTo] = useState<string>('');
  const [ayahTo, setAyahTo] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!data) return;
    setPages(data.pagesRead ?? 0);
    setMinutes(data.minutesRead ?? 0);
    setSurahFrom(data.surahFrom?.toString() ?? '');
    setAyahFrom(data.ayahFrom?.toString() ?? '');
    setSurahTo(data.surahTo?.toString() ?? '');
    setAyahTo(data.ayahTo?.toString() ?? '');
    setNotes(data.notes ?? '');
  }, [data]);

  // Auto-save when a stepper changes
  const saveStepper = (next: { pagesRead?: number; minutesRead?: number }) => {
    upsert.mutate({
      pagesRead: next.pagesRead ?? pages,
      minutesRead: next.minutesRead ?? minutes,
      ...maybeSurahPayload(),
      notes: notes || undefined,
    });
  };

  const maybeSurahPayload = () => {
    const sf = surahFrom ? Number(surahFrom) : undefined;
    const af = ayahFrom ? Number(ayahFrom) : undefined;
    const st = surahTo ? Number(surahTo) : undefined;
    const at = ayahTo ? Number(ayahTo) : undefined;
    return {
      surahFrom: Number.isFinite(sf) ? sf : undefined,
      ayahFrom: Number.isFinite(af) ? af : undefined,
      surahTo: Number.isFinite(st) ? st : undefined,
      ayahTo: Number.isFinite(at) ? at : undefined,
    };
  };

  const saveDetails = async () => {
    try {
      await upsert.mutateAsync({
        pagesRead: pages,
        minutesRead: minutes,
        ...maybeSurahPayload(),
        notes: notes || undefined,
      });
      toast.success('Quran reading saved');
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : 'Could not save';
      toast.error(msg);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Quran"
        description="Log pages, minutes, and the surah/ayah range you read each day."
      />

      <DatePickerBar date={date} onChange={setDate} />

      {isLoading ? (
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <>
          {/* Hero card */}
          <div className="relative mb-6 overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-accent/5 p-6 md:p-8">
            <GeometricPattern className="text-accent" opacity={0.05} />
            <div
              className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-accent/15 blur-3xl"
              aria-hidden
            />

            <div className="relative grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
              <div className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-deep text-accent-foreground shadow-md">
                <BookOpen className="size-6" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Today&apos;s reading
                </p>
                <p className="mt-1 text-3xl font-bold tracking-tight">
                  <span className="tabular-nums text-gradient">{pages}</span>
                  <span className="ml-1.5 text-base font-medium text-muted-foreground">pages</span>
                  <span className="mx-3 text-muted-foreground/40">·</span>
                  <span className="tabular-nums text-gradient">{minutes}</span>
                  <span className="ml-1.5 text-base font-medium text-muted-foreground">min</span>
                </p>
              </div>
            </div>
          </div>

          {/* Steppers */}
          <Card className="mb-6 border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Quick log
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="flex flex-col items-start gap-2">
                <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Pages read
                </Label>
                <NumberStepper
                  value={pages}
                  onChange={(v) => {
                    setPages(v);
                    saveStepper({ pagesRead: v });
                  }}
                  min={0}
                  max={1000}
                  unit="pages"
                  size="md"
                />
              </div>
              <div className="flex flex-col items-start gap-2">
                <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Minutes read
                </Label>
                <NumberStepper
                  value={minutes}
                  onChange={(v) => {
                    setMinutes(v);
                    saveStepper({ minutesRead: v });
                  }}
                  min={0}
                  max={600}
                  step={5}
                  unit="min"
                  size="md"
                />
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Surah &amp; ayah range
                <span className="ml-2 text-[10px] font-normal text-muted-foreground/70">
                  optional
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <Label htmlFor="surahFrom" className="text-xs">
                    From surah
                  </Label>
                  <Input
                    id="surahFrom"
                    type="number"
                    min={1}
                    max={114}
                    value={surahFrom}
                    onChange={(e) => setSurahFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="ayahFrom" className="text-xs">
                    Ayah
                  </Label>
                  <Input
                    id="ayahFrom"
                    type="number"
                    min={1}
                    value={ayahFrom}
                    onChange={(e) => setAyahFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="surahTo" className="text-xs">
                    To surah
                  </Label>
                  <Input
                    id="surahTo"
                    type="number"
                    min={1}
                    max={114}
                    value={surahTo}
                    onChange={(e) => setSurahTo(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="ayahTo" className="text-xs">
                    Ayah
                  </Label>
                  <Input
                    id="ayahTo"
                    type="number"
                    min={1}
                    value={ayahTo}
                    onChange={(e) => setAyahTo(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="text-xs">
                  Notes &amp; reflections
                </Label>
                <Textarea
                  id="notes"
                  placeholder="What stayed with you today?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={saveDetails}
                  disabled={upsert.isPending}
                  className="rounded-full"
                >
                  {upsert.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Save details
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
