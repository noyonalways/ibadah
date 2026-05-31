'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { detectTimezone, groupedTimezones } from '@/lib/timezones';

interface Props {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}

export function TimezoneSelect({ id, value, onChange, disabled }: Props) {
  const t = useTranslations('Settings');
  const groups = useMemo(() => groupedTimezones(), []);

  const known = useMemo(() => {
    const set = new Set<string>();
    for (const g of groups) for (const z of g.zones) set.add(z.value);
    return set;
  }, [groups]);

  return (
    <div className="flex items-stretch gap-2">
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {!known.has(value) && value && (
            <SelectGroup label={t('timezone_current')}>
              <SelectItem value={value}>{value}</SelectItem>
            </SelectGroup>
          )}
          {groups.map((group) => (
            <SelectGroup key={group.region} label={group.region}>
              {group.zones.map((z) => (
                <SelectItem key={z.value} value={z.value}>
                  {z.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          const tz = detectTimezone();
          if (tz) onChange(tz);
        }}
        disabled={disabled}
        className="shrink-0 rounded-md text-muted-foreground"
        title={t('timezone_use_device')}
      >
        <Globe className="size-4" />
      </Button>
    </div>
  );
}
