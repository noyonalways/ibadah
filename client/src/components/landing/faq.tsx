'use client';

import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { LandingSection } from '@/components/landing/landing-section';
import { SectionHeader } from '@/components/landing/section-header';
import { StaggerReveal } from '@/components/landing/stagger-reveal';

const FAQ_KEYS = ['free', 'auth', 'languages', 'privacy', 'prayer_times', 'scoring'] as const;

export function FAQ({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('Landing');

  const Body = (
    <div className="mx-auto max-w-3xl">
      <StaggerReveal
        as="ul"
        className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card/55 backdrop-blur-xl"
        stagger={60}
      >
        {FAQ_KEYS.map((key) => (
          <li key={key}>
            <details className="group/faq cursor-pointer">
              <summary className="flex list-none items-center justify-between gap-4 px-6 py-5 transition-colors hover:bg-muted/30 [&::-webkit-details-marker]:hidden">
                <span className="text-base font-medium tracking-tight">{t(`faq_${key}_q`)}</span>
                <span
                  aria-hidden
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-open/faq:rotate-45"
                >
                  <Plus className="size-4" />
                </span>
              </summary>
              <div className="px-6 pb-6 pt-0 text-sm leading-relaxed text-muted-foreground">
                {t(`faq_${key}_a`)}
              </div>
            </details>
          </li>
        ))}
      </StaggerReveal>
    </div>
  );

  if (compact) return Body;

  return (
    <LandingSection id="faq" tone="muted" divider>
      <SectionHeader
        eyebrow={t('faq_eyebrow')}
        title={t('faq_title')}
        subtitle={t('faq_subtitle')}
      />
      <div className="mt-12">{Body}</div>
    </LandingSection>
  );
}
