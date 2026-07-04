import { type ReactNode } from 'react';
import { Reveal } from '@/components/shared/reveal';

interface SectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
}

/** Shared heading block with cascaded scroll reveals. */
export function SectionHeader({ eyebrow, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow ? (
        <Reveal variant="blur-up" delay={0}>
          <span className="inline-flex items-center rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            {eyebrow}
          </span>
        </Reveal>
      ) : null}
      <Reveal variant="blur-up" delay={eyebrow ? 80 : 0}>
        <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      </Reveal>
      {subtitle ? (
        <Reveal variant="blur-up" delay={eyebrow ? 160 : 80}>
          <p className="mt-4 text-pretty text-muted-foreground md:text-lg">{subtitle}</p>
        </Reveal>
      ) : null}
    </div>
  );
}
