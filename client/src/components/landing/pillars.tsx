import { useTranslations } from 'next-intl';
import { Sun, Sunrise, Sunset, MoonStar } from 'lucide-react';
import { IslamicDivider } from '@/components/shared/islamic-divider';
import { Reveal } from '@/components/shared/reveal';
import { LandingSection } from '@/components/landing/landing-section';
import { SectionHeader } from '@/components/landing/section-header';
import { StaggerReveal } from '@/components/landing/stagger-reveal';

export function Pillars() {
  const t = useTranslations('Landing');
  const tSalah = useTranslations('Salah');

  const STATIONS = [
    { name: tSalah('fajr'), meaning: t('station_dawn'), icon: Sunrise, gradient: 'bg-prayer-fajr' },
    { name: tSalah('dhuhr'), meaning: t('station_midday'), icon: Sun, gradient: 'bg-prayer-dhuhr' },
    { name: tSalah('asr'), meaning: t('station_afternoon'), icon: Sun, gradient: 'bg-prayer-asr' },
    {
      name: tSalah('maghrib'),
      meaning: t('station_sunset'),
      icon: Sunset,
      gradient: 'bg-prayer-maghrib',
    },
    {
      name: tSalah('isha'),
      meaning: t('station_night'),
      icon: MoonStar,
      gradient: 'bg-prayer-isha',
    },
  ];

  return (
    <LandingSection id="pillars" divider>
      <SectionHeader
        eyebrow={t('pillars_eyebrow')}
        title={
          <>
            {t('pillars_title_pre')}{' '}
            <span className="text-gradient">{t('pillars_title_dawn')}</span>{' '}
            {t('pillars_title_to')}{' '}
            <span className="text-gradient">{t('pillars_title_midnight')}</span>{' '}
            {t('pillars_title_post')}
          </>
        }
        subtitle={t('pillars_subtitle')}
      />

      <StaggerReveal className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5" stagger={70}>
        {STATIONS.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.name}
              className="lift-hover group overflow-hidden rounded-2xl border border-border/50 shadow-sm"
            >
              <div className={`relative h-44 ${s.gradient} p-5 text-white`}>
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
                  <Icon className="size-5 opacity-90 transition-transform duration-300 group-hover:scale-110" />
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] opacity-80">{s.meaning}</p>
                    <p className="mt-1 text-xl font-semibold tracking-tight">{s.name}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </StaggerReveal>

      <Reveal variant="blur-up" delay={200}>
        <IslamicDivider className="mx-auto mt-14 max-w-md" />
      </Reveal>
    </LandingSection>
  );
}
