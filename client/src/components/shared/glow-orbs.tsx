import { cn } from '@/lib/utils';

/**
 * Layered, slowly-breathing color orbs used as a luminous backdrop behind
 * heroes and auth panels. Rendered absolutely; parent should be `relative`
 * and `overflow-hidden`.
 */
export function GlowOrbs({
  className,
  variant = 'aurora',
}: {
  className?: string;
  variant?: 'aurora' | 'twilight' | 'subtle';
}) {
  const palette =
    variant === 'twilight'
      ? {
          a: 'bg-tertiary/35',
          b: 'bg-primary/30',
          c: 'bg-accent/20',
        }
      : variant === 'subtle'
        ? {
            a: 'bg-primary/15',
            b: 'bg-accent/10',
            c: 'bg-tertiary/10',
          }
        : {
            a: 'bg-primary/35',
            b: 'bg-accent/25',
            c: 'bg-tertiary/20',
          };

  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      <div
        className={cn(
          'absolute -left-20 -top-32 h-[420px] w-[420px] rounded-full blur-3xl animate-breathe',
          palette.a,
        )}
      />
      <div
        className={cn(
          'absolute -right-20 -top-10 h-[380px] w-[380px] rounded-full blur-3xl animate-breathe-slow',
          palette.b,
        )}
        style={{ animationDelay: '1.5s' }}
      />
      <div
        className={cn(
          'absolute bottom-[-160px] left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full blur-3xl animate-breathe',
          palette.c,
        )}
        style={{ animationDelay: '3s' }}
      />
    </div>
  );
}
