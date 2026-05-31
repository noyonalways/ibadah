'use client';

import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { KUTUB_AS_SITTAH, type HadithBookSlug } from '@/lib/hadith-api';

interface Props {
  value: HadithBookSlug;
  onChange: (next: HadithBookSlug) => void;
  id?: string;
}

/**
 * Picker for the six canonical Sunni hadith collections. Order matches
 * `KUTUB_AS_SITTAH` (Bukhari → Muslim → Nasa'i → Abu Dawud → Tirmidhi
 * → Ibn Majah). Each option is rendered with the book title in the
 * user's locale.
 */
export function BookPicker({ value, onChange, id }: Props) {
  const t = useTranslations('Hadith');

  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
      >
        {t('book_label')}
      </Label>
      <Select value={value} onValueChange={(v) => onChange(v as HadithBookSlug)}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {KUTUB_AS_SITTAH.map((b) => (
            <SelectItem key={b.slug} value={b.slug}>
              {t(`books.${b.titleKey}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
