import { useTranslations } from 'next-intl';
import { Flame, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function StreakCard({
  current,
  longest,
}: {
  current: number;
  longest: number;
}) {
  const t = useTranslations('Dashboard');

  return (
    <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-accent/5">
      <div
        className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-accent/20 blur-3xl"
        aria-hidden
      />
      <CardContent className="relative flex items-center gap-4 p-4 sm:gap-5 sm:p-6">
        <div className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent via-accent-deep to-primary text-accent-foreground shadow-lg shadow-accent/30 sm:size-16">
          <Flame className="size-5 sm:size-7" />
          <span
            className="absolute inset-0 -z-10 rounded-2xl bg-accent/40 blur-xl animate-breathe"
            aria-hidden
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:tracking-[0.2em]">
            {t('currentStreak')}
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
            {current}
            <span className="ml-1 text-sm font-medium text-muted-foreground">{t('days')}</span>
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Trophy className="size-3.5 shrink-0 text-accent" />
            <span className="truncate tabular-nums">
              {t('longest_label')} {longest} {t('days')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
