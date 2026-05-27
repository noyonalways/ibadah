'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';

import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { detectTimezone, groupedTimezones } from '@/lib/timezones';

interface Props {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}

/**
 * Region-grouped IANA timezone select. Pulls the live list from
 * `Intl.supportedValuesOf` when available, with a curated fallback.
 * Adds a "Use my device timezone" shortcut that resolves to the
 * browser's best guess.
 */
export function TimezoneSelect({ id, value, onChange, disabled }: Props) {
  const t = useTranslations('Settings');
  const groups = useMemo(() => groupedTimezones(), []);

  // If the saved value isn't in the catalog (rare — old custom string),
  // surface it at the top so it remains visible and selectable until
  // the user changes it.
  const known = useMemo(() => {
    const set = new Set<string>();
    for (const g of groups) for (const z of g.zones) set.add(z.value);
    return set;
  }, [groups]);

  const useDeviceTz = () => {
    const tz = detectTimezone();
    if (tz) onChange(tz);
  };

  return (
    <div className="flex items-stretch gap-2">
      <Select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="flex-1"
      >
        {!known.has(value) && value && (
          <optgroup label={t('timezone_current')}>
            <option value={value}>{value}</option>
          </optgroup>
        )}
        {groups.map((group) => (
          <optgroup key={group.region} label={group.region}>
            {group.zones.map((z) => (
              <option key={z.value} value={z.value}>
                {z.label}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={useDeviceTz}
        disabled={disabled}
        className="shrink-0 rounded-md text-muted-foreground"
        title={t('timezone_use_device')}
      >
        <Globe className="size-4" />
      </Button>
    </div>
  );
}
