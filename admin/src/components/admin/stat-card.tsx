import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Compact KPI card used across the admin dashboard and detail pages. The
 * tone determines the gradient + icon background.
 */
export function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  tone = 'primary',
  className,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: LucideIcon;
  tone?: 'primary' | 'accent' | 'tertiary' | 'destructive';
  className?: string;
}) {
  const tones: Record<NonNullable<typeof tone>, string> = {
    primary: 'from-primary/15 via-card to-card',
    accent: 'from-accent/20 via-card to-card',
    tertiary: 'from-tertiary/15 via-card to-card',
    destructive: 'from-destructive/12 via-card to-card',
  };
  const iconBg: Record<NonNullable<typeof tone>, string> = {
    primary: 'bg-primary/15 text-primary',
    accent: 'bg-accent/30 text-accent-foreground',
    tertiary: 'bg-tertiary/15 text-tertiary',
    destructive: 'bg-destructive/15 text-destructive',
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-border/60 bg-gradient-to-br',
        tones[tone],
        className,
      )}
    >
      <CardContent className="flex items-center gap-4 p-6">
        <div className={cn('grid size-12 place-items-center rounded-xl', iconBg[tone])}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-0.5 text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {value}
          </p>
          {sublabel && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{sublabel}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
