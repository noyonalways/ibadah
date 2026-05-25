import { useTranslations } from 'next-intl';
import {
  BookOpen,
  CheckCircle2,
  ListChecks,
  LineChart,
  HandHeart,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

const FEATURES: {
  key: 'salah' | 'quran' | 'dhikr' | 'habits' | 'checklist' | 'visuals';
  icon: LucideIcon;
  accent: string;
  iconTone: string;
}[] = [
  {
    key: 'salah',
    icon: CheckCircle2,
    accent: 'from-primary/30 via-primary/5 to-transparent',
    iconTone: 'text-primary bg-primary/10',
  },
  {
    key: 'quran',
    icon: BookOpen,
    accent: 'from-accent/30 via-accent/5 to-transparent',
    iconTone: 'text-accent-foreground bg-accent/30',
  },
  {
    key: 'dhikr',
    icon: HandHeart,
    accent: 'from-tertiary/30 via-tertiary/5 to-transparent',
    iconTone: 'text-tertiary bg-tertiary/15',
  },
  {
    key: 'habits',
    icon: ListChecks,
    accent: 'from-primary/30 via-primary/5 to-transparent',
    iconTone: 'text-primary bg-primary/10',
  },
  {
    key: 'checklist',
    icon: Sparkles,
    accent: 'from-accent/30 via-accent/5 to-transparent',
    iconTone: 'text-accent-foreground bg-accent/30',
  },
  {
    key: 'visuals',
    icon: LineChart,
    accent: 'from-tertiary/30 via-tertiary/5 to-transparent',
    iconTone: 'text-tertiary bg-tertiary/15',
  },
];

export function Features() {
  const t = useTranslations('Landing');

  return (
    <section id="features" className="relative border-t border-border/40 py-24 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            Everything you need
          </span>
          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight md:text-5xl">
            {t('featuresTitle')}
          </h2>
          <p className="mt-4 text-muted-foreground md:text-lg">{t('featuresSubtitle')}</p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ key, icon: Icon, accent, iconTone }) => (
            <article
              key={key}
              className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10"
            >
              {/* Accent gradient that intensifies on hover */}
              <div
                className={`pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-gradient-radial blur-3xl bg-gradient-to-br ${accent} opacity-60 transition-opacity duration-500 group-hover:opacity-100`}
                aria-hidden
              />

              {/* Hairline shimmer on top */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
                aria-hidden
              />

              <div className="relative">
                <div
                  className={`grid size-11 place-items-center rounded-xl ${iconTone} ring-1 ring-inset ring-white/5`}
                >
                  <Icon className="size-5" />
                </div>

                <h3 className="mt-5 text-lg font-semibold tracking-tight">
                  {t(`feature_${key}_title`)}
                </h3>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {t(`feature_${key}_desc`)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
