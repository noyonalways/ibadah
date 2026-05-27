import { useTranslations } from 'next-intl';
import { Sun, Sunrise, Sunset, Moon, MoonStar } from 'lucide-react';
import { IslamicDivider } from '@/components/shared/islamic-divider';
import { Reveal } from '@/components/shared/reveal';

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
    <section id="pillars" className="relative py-20 md:py-28">
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Moon className="size-3.5 text-primary" />
              {t('pillars_eyebrow')}
            </span>
            <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight md:text-5xl">
              {t('pillars_title_pre')}{' '}
              <span className="text-gradient">{t('pillars_title_dawn')}</span>{' '}
              {t('pillars_title_to')}{' '}
              <span className="text-gradient">{t('pillars_title_midnight')}</span>{' '}
              {t('pillars_title_post')}
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground md:text-lg">
              {t('pillars_subtitle')}
            </p>
          </div>
        </Reveal>

        {/* Five station cards */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {STATIONS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.name} delay={i * 90}>
                <div className="group relative overflow-hidden rounded-2xl border border-white/10 shadow-lg shadow-primary/10 transition-transform duration-500 hover:-translate-y-1">
                  <div className={`relative h-44 ${s.gradient} p-5 text-white`}>
                    <div
                      className="absolute inset-0 opacity-25"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0px, transparent 1.5px), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.25) 0px, transparent 1.5px)',
                        backgroundSize: '24px 24px',
                      }}
                      aria-hidden
                    />
                    <div className="absolute -bottom-10 -right-10 size-32 rounded-full bg-white/15 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    <div className="relative flex h-full flex-col justify-between">
                      <Icon className="size-5 opacity-90" />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.22em] opacity-80">
                          {s.meaning}
                        </p>
                        <p className="mt-1 text-2xl font-semibold tracking-tight">{s.name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <IslamicDivider className="mx-auto mt-16 max-w-md" />
      </div>
    </section>
  );
}
