'use client';

import { useTranslations } from 'next-intl';
import { Activity, Flame, Languages, Moon } from 'lucide-react';
import { AnimatedCounter } from '@/components/shared/animated-counter';
import { StaggerReveal } from '@/components/landing/stagger-reveal';

export function ProofBar() {
  const t = useTranslations('Landing');

  const STATS = [
    { icon: Moon, value: 5, label: t('proof_prayers'), sublabel: t('proof_prayers_sub') },
    { icon: Flame, value: 7, label: t('proof_streaks'), sublabel: t('proof_streaks_sub') },
    { icon: Languages, value: 3, label: t('proof_languages'), sublabel: t('proof_languages_sub') },
    {
      icon: Activity,
      value: 175,
      label: t('proof_max_points'),
      sublabel: t('proof_max_points_sub'),
    },
  ];

  return (
    <StaggerReveal className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/40 lg:grid-cols-4" stagger={100}>
      {STATS.map(({ icon: Icon, value, label, sublabel }) => (
        <div
          key={label}
          className="flex items-start gap-3.5 bg-card/70 p-5 backdrop-blur-xl md:p-6"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/10">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-2xl font-bold leading-none tracking-tight">
              <AnimatedCounter to={value} />
            </p>
            <p className="mt-1.5 text-sm font-medium leading-tight">{label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>
          </div>
        </div>
      ))}
    </StaggerReveal>
  );
}
