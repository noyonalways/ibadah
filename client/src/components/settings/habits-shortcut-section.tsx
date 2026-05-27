'use client';

import { useTranslations } from 'next-intl';
import { ArrowUpRight, ListChecks } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/i18n/routing';
import { useHabits } from '@/hooks/use-habit';

export function HabitsShortcutSection() {
  const t = useTranslations('Settings');
  const { data, isLoading } = useHabits();
  const count = (data ?? []).filter((h) => !h.archived).length;

  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <ListChecks className="size-4" />
          </span>
          <div>
            <CardTitle className="text-base">{t('habits_section')}</CardTitle>
            <CardDescription>{t('habits_section_desc')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Link
          href="/habits"
          className="group flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/10"
        >
          <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <ListChecks className="size-4" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium leading-none">{t('manage_habits')}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isLoading
                ? '…'
                : count > 0
                  ? t('habits_count', { count })
                  : t('habits_count_zero')}
            </p>
          </div>
          <ArrowUpRight className="size-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
        </Link>
      </CardContent>
    </Card>
  );
}
