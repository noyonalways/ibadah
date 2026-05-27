import { Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Empty state stamped onto admin features that need new server endpoints.
 *
 * Per design.md §10.2, every cross-user / system-wide page lists the
 * exact REST contract the server will need to expose so the page can
 * "light up" without UI rework.
 */
export function RequiresAdminApi({
  title = 'Awaiting admin endpoints',
  description,
  endpoints,
  className,
  children,
}: {
  title?: string;
  description?: string;
  endpoints: { method: string; path: string; note?: string }[];
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        'overflow-hidden border-dashed bg-gradient-to-br from-amber-500/5 via-card to-card',
        className,
      )}
    >
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
          <Lock className="size-5" />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3 className="text-base font-semibold tracking-tight">{title}</h3>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>

          <div className="rounded-lg border border-border/60 bg-card/60 p-3">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Required server contract
            </p>
            <ul className="space-y-1.5 font-mono text-xs">
              {endpoints.map((e) => (
                <li key={`${e.method} ${e.path}`} className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                      e.method === 'GET' && 'bg-primary/10 text-primary',
                      e.method === 'POST' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
                      e.method === 'PATCH' && 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
                      e.method === 'PUT' && 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
                      e.method === 'DELETE' && 'bg-destructive/15 text-destructive',
                    )}
                  >
                    {e.method}
                  </span>
                  <span className="text-foreground">{e.path}</span>
                  {e.note && (
                    <span className="text-muted-foreground"> — {e.note}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {children}
        </div>
      </div>
    </Card>
  );
}
