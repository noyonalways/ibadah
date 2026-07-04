import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type SectionTone = 'default' | 'muted' | 'accent';

interface LandingSectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Subtle background band for visual rhythm between sections */
  tone?: SectionTone;
  /** Hairline gradient divider at the top */
  divider?: boolean;
}

export function LandingSection({
  id,
  children,
  className,
  tone = 'default',
  divider = false,
}: LandingSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'relative py-20 md:py-28',
        tone === 'muted' && 'bg-muted/25',
        tone === 'accent' && 'bg-primary/[0.03]',
        className,
      )}
    >
      {divider ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/80 to-transparent"
          aria-hidden
        />
      ) : null}
      <div className="container relative mx-auto px-4">{children}</div>
    </section>
  );
}
