import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface LandingCardProps {
  children: ReactNode;
  className?: string;
  /** Enable lift + glow on hover */
  interactive?: boolean;
  as?: 'article' | 'div';
}

/** Glass card surface shared across landing sections. */
export function LandingCard({
  children,
  className,
  interactive = true,
  as: Tag = 'article',
}: LandingCardProps) {
  return (
    <Tag
      className={cn(
        'landing-card group relative overflow-hidden rounded-2xl border border-border/60 bg-card/55 p-6 backdrop-blur-xl',
        interactive && 'lift-hover',
        className,
      )}
      data-static={interactive ? undefined : true}
    >
      <div className="landing-card-shine pointer-events-none absolute inset-0 opacity-0" aria-hidden />
      <div className="landing-card-glow pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-primary/10 blur-3xl opacity-0" aria-hidden />
      <div className="relative">{children}</div>
    </Tag>
  );
}
