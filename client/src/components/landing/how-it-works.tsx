import { useTranslations } from 'next-intl';
import { Compass, Heart, LineChart } from 'lucide-react';
import { LandingCard } from '@/components/landing/landing-card';
import { LandingSection } from '@/components/landing/landing-section';
import { SectionHeader } from '@/components/landing/section-header';
import { StaggerReveal } from '@/components/landing/stagger-reveal';

export function HowItWorks() {
  const t = useTranslations('Landing');

  const STEPS = [
    {
      step: '01',
      icon: Compass,
      titleKey: 'how_step1_title',
      descKey: 'how_step1_desc',
      iconTone: 'bg-primary/10 text-primary ring-primary/15',
    },
    {
      step: '02',
      icon: Heart,
      titleKey: 'how_step2_title',
      descKey: 'how_step2_desc',
      iconTone: 'bg-accent/25 text-accent-foreground ring-accent/25',
    },
    {
      step: '03',
      icon: LineChart,
      titleKey: 'how_step3_title',
      descKey: 'how_step3_desc',
      iconTone: 'bg-tertiary/15 text-tertiary ring-tertiary/20',
    },
  ] as const;

  return (
    <LandingSection id="how" tone="muted" divider>
      <SectionHeader
        eyebrow={t('how_eyebrow')}
        title={
          <>
            {t('how_title_1')} <span className="text-gradient">{t('how_title_2')}</span>{' '}
            {t('how_title_3')}
          </>
        }
        subtitle={t('how_subtitle')}
      />

      <StaggerReveal
        as="ol"
        className="mt-12 grid list-none gap-4 md:grid-cols-3 md:gap-5"
        stagger={100}
      >
        {STEPS.map(({ step, icon: Icon, titleKey, descKey, iconTone }) => (
          <li key={step}>
            <LandingCard className="h-full">
              <div className="flex items-center justify-between">
                <span
                  className={`grid size-10 place-items-center rounded-xl ring-1 ring-inset ${iconTone}`}
                >
                  <Icon className="size-5" />
                </span>
                <span className="font-display text-2xl font-bold text-muted-foreground/30">
                  {step}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{t(titleKey)}</h3>
              <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                {t(descKey)}
              </p>
            </LandingCard>
          </li>
        ))}
      </StaggerReveal>
    </LandingSection>
  );
}
