import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DayPoints } from '@/lib/stats-api';
import { cn } from '@/lib/utils';

/**
 * GitHub-style activity heatmap. Renders a 7-row x N-col grid going
 * back ~10 weeks, intensity-tinted by total daily points.
 */
export function ActivityHeatmap({ days }: { days: DayPoints[] }) {
  const t = useTranslations('Dashboard');
  const map = new Map(days.map((d) => [d.date, d.total]));
  const cols = 10;
  const totalCells = cols * 7;

  // Build the cell grid (oldest -> today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: { date: string; value: number }[] = [];
  for (let i = totalCells - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: key, value: map.get(key) ?? 0 });
  }

  return (
    <Card className="relative overflow-hidden border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {t('last_n_weeks', { weeks: cols })}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridAutoRows: 'minmax(0, 1fr)',
          }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="flex flex-col gap-1.5">
              {Array.from({ length: 7 }).map((__, r) => {
                const cell = cells[c * 7 + r];
                const intensity = intensityClass(cell.value);
                return (
                  <span
                    key={cell.date}
                    title={`${cell.date}: ${cell.value} pts`}
                    className={cn(
                      'aspect-square rounded-[4px] ring-1 ring-inset ring-border/30 transition-colors',
                      intensity,
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <span>{t('less')}</span>
          <div className="flex gap-1">
            <span className="size-2.5 rounded-[3px] bg-muted" />
            <span className="size-2.5 rounded-[3px] bg-primary/25" />
            <span className="size-2.5 rounded-[3px] bg-primary/50" />
            <span className="size-2.5 rounded-[3px] bg-primary/75" />
            <span className="size-2.5 rounded-[3px] bg-primary" />
          </div>
          <span>{t('more')}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function intensityClass(value: number): string {
  if (value <= 0) return 'bg-muted';
  if (value < 20) return 'bg-primary/25';
  if (value < 50) return 'bg-primary/50';
  if (value < 90) return 'bg-primary/75';
  return 'bg-primary';
}
