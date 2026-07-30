'use client';

import { useTranslations } from 'next-intl';
import { Mic, Database, BellRing, Sparkles, Clock, Compass } from 'lucide-react';
import { Reveal } from '@/components/shared/reveal';
import { StaggerReveal } from '@/components/landing/stagger-reveal';

export function AiFutureRoadmap() {
  const t = useTranslations();

  const FUTURE_FEATURES = [
    {
      icon: Database,
      title: 'Full Vector RAG Quran & Hadith Index',
      status: 'In Development',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      description:
        'Deep semantic search over all 114 Surahs, classical Tafsir (Ibn Kathir), and Kutub al-Sittah Hadiths with instant scholar-verified references.',
    },
    {
      icon: Mic,
      title: 'Audio Tajweed & Recitation Analyzer',
      status: 'Planned Concept',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      description:
        'AI audio processing to listen to user Quran recitations in real-time, highlighting pronunciation improvements and Tajweed rule practice.',
    },
    {
      icon: BellRing,
      title: 'Predictive Smart Worship Reminders',
      status: 'Research Phase',
      badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      description:
        'Context-aware AI notifications tailored to your routine (e.g. recommending Sunnah fasting days, Tahajjud windows, and Dhikr targets).',
    },
  ];

  return (
    <section className="relative bg-muted/40 py-16 md:py-24 border-t border-border/50">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal variant="fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-3">
              <Compass className="size-3.5" />
              <span>Future Innovation Roadmap</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
              Next-Generation AI Capabilities
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Sneak peek into upcoming AI modules currently planned and under active development.
            </p>
          </Reveal>
        </div>

        <StaggerReveal className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3" stagger={100}>
          {FUTURE_FEATURES.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative rounded-2xl border border-dashed border-border/80 bg-card/80 p-6 shadow-sm backdrop-blur transition-all duration-300 hover:border-primary/50 hover:bg-card"
              >
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${item.badgeColor}`}>
                    {item.status}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            );
          })}
        </StaggerReveal>
      </div>
    </section>
  );
}
