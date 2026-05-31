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
import { listSections, type HadithMetadata } from '@/lib/hadith-api';

interface Props {
  /** Edition metadata used to enumerate sections. */
  meta: HadithMetadata | null;
  /** "all" or stringified section index. */
  value: string;
  onChange: (next: string) => void;
  id?: string;
}

const ALL_SECTIONS = 'all';

/**
 * Section / chapter jumper. Restricts the displayed hadith list to a
 * single section (a "kitab" or numbered chapter) of the active book.
 *
 * The first option, "all", is the default — keeping it first means the
 * user can scroll through the entire book without picking a section.
 */
export function SectionJumper({ meta, value, onChange, id }: Props) {
  const t = useTranslations('Hadith');
  const sections = meta ? listSections(meta) : [];
  const disabled = meta === null || sections.length === 0;

  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
      >
        {t('section_picker_label')}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_SECTIONS}>
            {meta && sections.length > 0
              ? t('section_all', { count: sectionRangeTotal(sections) })
              : t('section_all_empty')}
          </SelectItem>
          {sections.map((s) => (
            <SelectItem key={s.key} value={s.key}>
              {`${s.index}. ${s.title || t('section_untitled')} · ${s.detail.hadithnumber_first}–${s.detail.hadithnumber_last}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { ALL_SECTIONS };

function sectionRangeTotal(sections: ReturnType<typeof listSections>): number {
  if (sections.length === 0) return 0;
  return sections.reduce(
    (max, s) => Math.max(max, s.detail.hadithnumber_last),
    0,
  );
}
