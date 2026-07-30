'use client';

import { useTranslations } from 'next-intl';
import { BookOpen, ShieldCheck, UserCheck } from 'lucide-react';
import { Reveal } from '@/components/shared/reveal';
import { StaggerReveal } from '@/components/landing/stagger-reveal';

export function AiAuthenticityTrust() {
  const t = useTranslations();

  const TRUST_CARDS = [
    {
      icon: BookOpen,
      title: t('AiShowcase.trust_card1_title'),
      desc: t('AiShowcase.trust_card1_desc'),
      badge: 'Verifiable Citations',
    },
    {
      icon: ShieldCheck,
      title: t('AiShowcase.trust_card2_title'),
      desc: t('AiShowcase.trust_card2_desc'),
      badge: 'Zero Data Sharing',
    },
    {
      icon: UserCheck,
      title: t('AiShowcase.trust_card3_title'),
      desc: t('AiShowcase.trust_card3_desc'),
      badge: 'Scholar Aligned',
    },
  ];

  return (
    <section className="relative bg-muted/20 py-16 md:py-24 border-y border-border/50">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal variant="fade-up">
            <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
              {t('AiShowcase.trust_title')}
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              {t('AiShowcase.trust_subtitle')}
            </p>
          </Reveal>
        </div>

        <StaggerReveal className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3" stagger={100}>
          {TRUST_CARDS.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="relative rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-6" />
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                    {card.badge}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {card.desc}
                </p>
              </div>
            );
          })}
        </StaggerReveal>
      </div>
    </section>
  );
}
