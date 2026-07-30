'use client';

import { useTranslations } from 'next-intl';
import { Cpu, Database, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Reveal } from '@/components/shared/reveal';
import { StaggerReveal } from '@/components/landing/stagger-reveal';

export function AiHowItWorks() {
  const t = useTranslations();

  const STEPS = [
    {
      icon: Cpu,
      title: t('AiShowcase.step1_title'),
      desc: t('AiShowcase.step1_desc'),
      num: '01',
    },
    {
      icon: Database,
      title: t('AiShowcase.step2_title'),
      desc: t('AiShowcase.step2_desc'),
      num: '02',
    },
    {
      icon: ShieldCheck,
      title: t('AiShowcase.step3_title'),
      desc: t('AiShowcase.step3_desc'),
      num: '03',
    },
    {
      icon: CheckCircle2,
      title: t('AiShowcase.step4_title'),
      desc: t('AiShowcase.step4_desc'),
      num: '04',
    },
  ];

  return (
    <section className="relative bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal variant="fade-up">
            <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
              {t('AiShowcase.how_it_works_title')}
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              {t('AiShowcase.how_it_works_subtitle')}
            </p>
          </Reveal>
        </div>

        <StaggerReveal className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4" stagger={120}>
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-6" />
                  </div>
                  <span className="text-2xl font-extrabold text-muted-foreground/30">
                    {step.num}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </StaggerReveal>
      </div>
    </section>
  );
}
