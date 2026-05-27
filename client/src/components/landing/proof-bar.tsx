'use client';

import { useTranslations } from 'next-intl';
import { Activity, Flame, Languages, Moon } from 'lucide-react';
import { AnimatedCounter } from '@/components/shared/animated-counter';
import { Reveal } from '@/components/shared/reveal';

/**
 * A horizontal proof-bar of factual product stats. Numbers count up when
 * the bar enters the viewport. No fake user counts — these reflect what
 * the app actually does (5 daily prayers, 3 supported languages, etc).
 */
export function ProofBar() {
  const t = useTranslations('Landing');

  const STATS = [
    {
      icon: Moon,
      value: 5,
      label: t('proof_prayers'),
      sublabel: t('proof_prayers_sub'),
    },
    {
      icon: Flame,
      value: 7,
      label: t('proof_streaks'),
      sublabel: t('proof_streaks_sub'),
    },
    {
      icon: Languages,
      value: 3,
      label: t('proof_languages'),
      sublabel: t('proof_languages_sub'),
    },
    {
      icon: Activity,
      value: 175,
      label: t('proof_max_points'),
      sublabel: t('proof_max_points_sub'),
    },
  ];

  return (
    <section className="relative pt-2">
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="glass-card relative overflow-hidden rounded-3xl p-8 md:p-10">
            <div
              className="pointer-events-none absolute -inset-1 -z-10 rounded-[inherit] bg-gradient-to-br from-primary/15 via-transparent to-accent/15 blur-2xl"
              aria-hidden
            />
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {STATS.map(({ icon: Icon, value, label, sublabel }, i) => (
                <Reveal key={label} delay={i * 90}>
                  <div className="group flex items-start gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15 transition-colors group-hover:bg-primary/15">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <p className="text-3xl font-bold leading-none tracking-tight md:text-4xl">
                        <AnimatedCounter to={value} />
                      </p>
                      <p className="mt-2 text-sm font-medium">{label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{sublabel}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
