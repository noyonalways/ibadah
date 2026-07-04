import { useTranslations } from 'next-intl';
import { Sprout, Mountain, RotateCcw } from 'lucide-react';
import { LandingSection } from '@/components/landing/landing-section';
import { SectionHeader } from '@/components/landing/section-header';
import { StaggerReveal } from '@/components/landing/stagger-reveal';

export function Personas() {
  const t = useTranslations('Landing');

  const PEOPLE = [
    { key: 'beginner', icon: Sprout, tone: 'bg-prayer-fajr' },
    { key: 'consistent', icon: Mountain, tone: 'bg-prayer-dhuhr' },
    { key: 'returning', icon: RotateCcw, tone: 'bg-prayer-maghrib' },
  ] as const;

  return (
    <LandingSection id="for-you" tone="muted" divider>
      <SectionHeader
        eyebrow={t('personas_eyebrow')}
        title={
          <>
            {t('personas_title_1')}{' '}
            <span className="text-gradient">{t('personas_title_2')}</span>
          </>
        }
        subtitle={t('personas_subtitle')}
      />

      <StaggerReveal className="mt-12 grid gap-4 md:grid-cols-3 md:gap-5" stagger={110}>
        {PEOPLE.map(({ key, icon: Icon, tone }) => (
          <article
            key={key}
            className="lift-hover overflow-hidden rounded-2xl border border-border/60 bg-card/55 backdrop-blur-xl"
          >
            <div className={`relative h-28 p-5 text-white ${tone}`}>
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0px, transparent 1.5px), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.25) 0px, transparent 1.5px)',
                  backgroundSize: '24px 24px',
                }}
                aria-hidden
              />
              <div className="relative flex h-full flex-col justify-between">
                <Icon className="size-5 opacity-95" />
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-90">
                  {t(`persona_${key}_label`)}
                </p>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold tracking-tight">
                {t(`persona_${key}_title`)}
              </h3>
              <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                {t(`persona_${key}_desc`)}
              </p>
              <p className="mt-4 inline-flex rounded-full border border-border/60 bg-background/50 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                {t(`persona_${key}_help`)}
              </p>
            </div>
          </article>
        ))}
      </StaggerReveal>
    </LandingSection>
  );
}
