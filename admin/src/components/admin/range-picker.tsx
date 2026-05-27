'use client';

/**
 * Reusable range picker — preset shortcuts (7/30/90 days) + a custom
 * From/To pair backed by the dependency-free DatePicker.
 *
 * Emits `{ from, to }` as YYYY-MM-DD strings. When a preset is active,
 * `from`/`to` are computed locally from `new Date()` so the parent
 * never has to think about timezones.
 */
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toDayKey } from '@/lib/utils';

const PRESETS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last 365 days' },
  { value: 'custom', label: 'Custom range' },
] as const;

export type RangePresetValue = (typeof PRESETS)[number]['value'];

export interface RangeValue {
  from: string;
  to: string;
}

interface RangePickerProps {
  defaultPreset?: Exclude<RangePresetValue, 'custom'>;
  presets?: { value: RangePresetValue; label: string }[];
  value?: RangeValue;
  onChange: (next: RangeValue) => void;
  className?: string;
}

function presetRange(days: number): RangeValue {
  const today = toDayKey(new Date());
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  return { from: toDayKey(start), to: today };
}


export function RangePicker({
  defaultPreset = '30',
  presets = PRESETS as unknown as { value: RangePresetValue; label: string }[],
  value,
  onChange,
  className,
}: RangePickerProps) {
  const [preset, setPreset] = useState<RangePresetValue>(defaultPreset);
  const [customFrom, setCustomFrom] = useState<string | undefined>(value?.from);
  const [customTo, setCustomTo] = useState<string | undefined>(value?.to);

  const isCustom = preset === 'custom';

  // Resolve the current effective range on every render. When a preset
  // is active, it derives from `new Date()`; the result is memoized so
  // we don't fire `onChange` on every render.
  const effective = useMemo<RangeValue>(() => {
    if (isCustom) {
      return {
        from: customFrom ?? toDayKey(new Date()),
        to: customTo ?? toDayKey(new Date()),
      };
    }
    return presetRange(parseInt(preset, 10));
  }, [preset, isCustom, customFrom, customTo]);

  useEffect(() => {
    onChange(effective);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effective.from, effective.to]);

  return (
    <Card className={className}>
      <CardContent className="grid gap-3 p-5 md:grid-cols-[200px_1fr_1fr]">
        <div className="space-y-1.5">
          <Label className="text-xs">Range</Label>
          <Select value={preset} onValueChange={(v) => setPreset(v as RangePresetValue)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {presets.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">From</Label>
          <DatePicker
            value={isCustom ? customFrom : effective.from}
            onChange={isCustom ? setCustomFrom : undefined}
            disabled={!isCustom}
            maxDate={isCustom ? customTo : undefined}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">To</Label>
          <DatePicker
            value={isCustom ? customTo : effective.to}
            onChange={isCustom ? setCustomTo : undefined}
            disabled={!isCustom}
            minDate={isCustom ? customFrom : undefined}
            maxDate={toDayKey(new Date())}
          />
        </div>
      </CardContent>
    </Card>
  );
}


