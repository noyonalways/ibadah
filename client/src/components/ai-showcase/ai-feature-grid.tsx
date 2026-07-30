'use client';

import { useTranslations } from 'next-intl';
import { MessageSquareQuote, BookOpenCheck, Scroll, HeartHandshake } from 'lucide-react';
import { Reveal } from '@/components/shared/reveal';
import { StaggerReveal } from '@/components/landing/stagger-reveal';

export function AiFeatureGrid() {
  const t = useTranslations();

  const FEATURES = [
    {
      icon: MessageSquareQuote,
      title: t('AiShowcase.feature_assistant_title'),
      description: t('AiShowcase.feature_assistant_desc'),
      gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      borderColor: 'group-hover:border-emerald-500/40',
      iconColor: 'text-emerald-500',
    },
    {
      icon: BookOpenCheck,
      title: t('AiShowcase.feature_quran_title'),
      description: t('AiShowcase.feature_quran_desc'),
      gradient: 'from-cyan-500/10 via-blue-500/5 to-transparent',
      borderColor: 'group-hover:border-cyan-500/40',
      iconColor: 'text-cyan-500',
    },
    {
      icon: Scroll,
      title: t('AiShowcase.feature_hadith_title'),
      description: t('AiShowcase.feature_hadith_desc'),
      gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
      borderColor: 'group-hover:border-amber-500/40',
      iconColor: 'text-amber-500',
    },
    {
      icon: HeartHandshake,
      title: t('AiShowcase.feature_reflection_title'),
      description: t('AiShowcase.feature_reflection_desc'),
      gradient: 'from-purple-500/10 via-indigo-500/5 to-transparent',
      borderColor: 'group-hover:border-purple-500/40',
      iconColor: 'text-purple-500',
    },
  ];

  return (
    <section className="relative py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <Reveal variant="fade-up">
            <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
              {t('AiShowcase.features_title')}
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              {t('AiShowcase.features_subtitle')}
            </p>
          </Reveal>
        </div>

        {/* Feature Cards Grid */}
        <StaggerReveal className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={100}>
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className={`group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${feat.borderColor}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feat.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                <div className="relative z-10">
                  <div className={`inline-flex rounded-xl bg-muted/80 p-3 ${feat.iconColor} transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="size-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </StaggerReveal>
      </div>
    </section>
  );
}
