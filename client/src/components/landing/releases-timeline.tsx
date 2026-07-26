'use me';
'use client';

import { useTranslations } from 'next-intl';
import { Sparkles, Bug, Zap, Calendar, Tag, GitCommit } from 'lucide-react';
import { useReleases } from '@/hooks/use-releases';
import { Badge } from '@/components/ui/badge';
import { Reveal } from '@/components/shared/reveal';
import { StaggerReveal } from '@/components/landing/stagger-reveal';
import type { ReleaseEntry } from '@/lib/releases-api';

export function ReleasesTimeline() {
  const t = useTranslations('ReleasesPage');
  const { data: releases, isLoading, isError } = useReleases();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 py-8">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-border/60 bg-card/50 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="h-7 w-20 rounded-full bg-muted" />
              <div className="h-4 w-28 rounded bg-muted" />
            </div>
            <div className="mt-6 space-y-4">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError || !releases || releases.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-border/60 bg-card/40 p-8 text-center backdrop-blur md:p-12">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <GitCommit className="size-6" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">{t('emptyTitle')}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t('emptyDescription')}</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-3xl space-y-10 md:space-y-14">
      {/* Vertical timeline spine line */}
      <div
        className="absolute bottom-4 left-4 top-4 hidden w-0.5 bg-gradient-to-b from-primary/40 via-primary/10 to-transparent md:left-6 md:block"
        aria-hidden
      />

      <StaggerReveal stagger={100}>
        {releases.map((release) => {
          // Group entries by category: features first, then enhancements, then fixes
          const features = release.entries.filter((e) => e.category === 'feature');
          const enhancements = release.entries.filter((e) => e.category === 'enhancement');
          const fixes = release.entries.filter((e) => e.category === 'fix');

          const formattedDate = new Date(release.date).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

          return (
            <div key={release._id || release.version} className="relative md:pl-14">
              {/* Timeline marker node (desktop) */}
              <div
                className="absolute left-4 top-2 hidden size-5 -translate-x-1/2 rounded-full border-2 border-primary bg-background ring-4 ring-background md:grid md:place-items-center"
                aria-hidden
              >
                <div className="size-2 rounded-full bg-primary" />
              </div>

              <div className="glass-card overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-6 shadow-xl shadow-primary/5 transition-all hover:border-primary/30 md:p-8">
                {/* Header: Version badge + Date */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary via-primary-soft to-accent-deep px-3.5 py-1 text-xs font-bold tracking-wide text-primary-foreground shadow-md shadow-primary/20">
                      <Tag className="size-3.5" />
                      {t('version')} {release.version}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <time dateTime={release.date}>{formattedDate}</time>
                  </div>
                </div>

                {/* Content: Grouped entries */}
                <div className="mt-6 space-y-6">
                  {/* Features */}
                  {features.length > 0 && (
                    <EntryGroup
                      items={features}
                      badgeLabel={t('badgeFeature')}
                      badgeVariant="default"
                      icon={<Sparkles className="size-4 text-emerald-500" />}
                    />
                  )}

                  {/* Enhancements */}
                  {enhancements.length > 0 && (
                    <EntryGroup
                      items={enhancements}
                      badgeLabel={t('badgeEnhancement')}
                      badgeVariant="secondary"
                      icon={<Zap className="size-4 text-amber-500" />}
                    />
                  )}

                  {/* Fixes */}
                  {fixes.length > 0 && (
                    <EntryGroup
                      items={fixes}
                      badgeLabel={t('badgeFix')}
                      badgeVariant="destructive"
                      icon={<Bug className="size-4 text-rose-500" />}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </StaggerReveal>
    </div>
  );
}

function EntryGroup({
  items,
  badgeLabel,
  badgeVariant,
  icon,
}: {
  items: ReleaseEntry[];
  badgeLabel: string;
  badgeVariant: 'default' | 'secondary' | 'destructive';
  icon: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <Badge variant={badgeVariant} className="text-[11px] font-semibold uppercase tracking-wider">
          {badgeLabel}
        </Badge>
      </div>
      <ul className="ml-6 space-y-2 text-sm leading-relaxed text-foreground/90">
        {items.map((item, idx) => (
          <li key={idx} className="relative list-disc tracking-tight">
            <span>{item.title}</span>
            {item.scope && (
              <span className="ml-2 inline-flex items-center rounded bg-muted/80 px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground">
                {item.scope}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
