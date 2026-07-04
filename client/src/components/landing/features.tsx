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
import { LandingCard } from '@/components/landing/landing-card';
import { LandingSection } from '@/components/landing/landing-section';
import { SectionHeader } from '@/components/landing/section-header';
import { StaggerReveal } from '@/components/landing/stagger-reveal';

const FEATURES: {
  key: 'salah' | 'quran' | 'dhikr' | 'habits' | 'checklist' | 'visuals';
  icon: LucideIcon;
  iconTone: string;
}[] = [
  { key: 'salah', icon: CheckCircle2, iconTone: 'text-primary bg-primary/10 ring-primary/15' },
  {
    key: 'quran',
    icon: BookOpen,
    iconTone: 'text-accent-foreground bg-accent/25 ring-accent/25',
  },
  { key: 'dhikr', icon: HandHeart, iconTone: 'text-tertiary bg-tertiary/15 ring-tertiary/20' },
  { key: 'habits', icon: ListChecks, iconTone: 'text-primary bg-primary/10 ring-primary/15' },
  {
    key: 'checklist',
    icon: Sparkles,
    iconTone: 'text-accent-foreground bg-accent/25 ring-accent/25',
  },
  { key: 'visuals', icon: LineChart, iconTone: 'text-tertiary bg-tertiary/15 ring-tertiary/20' },
];

export function Features() {
  const t = useTranslations('Landing');

  return (
    <LandingSection id="features" divider>
      <SectionHeader
        eyebrow={t('features_eyebrow')}
        title={t('featuresTitle')}
        subtitle={t('featuresSubtitle')}
      />

      <StaggerReveal className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5" stagger={80}>
        {FEATURES.map(({ key, icon: Icon, iconTone }) => (
          <LandingCard key={key} className="h-full">
            <span
              className={`grid size-10 place-items-center rounded-xl ring-1 ring-inset ${iconTone}`}
            >
              <Icon className="size-5" />
            </span>
            <h3 className="mt-4 text-lg font-semibold tracking-tight">
              {t(`feature_${key}_title`)}
            </h3>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
              {t(`feature_${key}_desc`)}
            </p>
          </LandingCard>
        ))}
      </StaggerReveal>
    </LandingSection>
  );
}
