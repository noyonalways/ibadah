'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Sparkles,
  Bug,
  Zap,
  Calendar,
  Tag,
  GitCommit,
  Search,
  Check,
  Copy,
  Layers,
  Flame,
  X,
  Filter,
} from 'lucide-react';
import { useReleases } from '@/hooks/use-releases';
import { Badge } from '@/components/ui/badge';
import { StaggerReveal } from '@/components/landing/stagger-reveal';
import type { ReleaseEntry } from '@/lib/releases-api';

type CategoryFilter = 'all' | 'feature' | 'enhancement' | 'fix';

export function ReleasesTimeline() {
  const t = useTranslations('ReleasesPage');
  const { data: releases, isLoading, isError } = useReleases();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [copiedVersion, setCopiedVersion] = useState<string | null>(null);

  const handleCopy = (version: string) => {
    navigator.clipboard.writeText(version);
    setCopiedVersion(version);
    setTimeout(() => setCopiedVersion(null), 2000);
  };

  // Processed metrics & filtered list
  const metrics = useMemo(() => {
    if (!releases || releases.length === 0) return null;
    const total = releases.length;
    const latest = releases[0];
    const lastDate = new Date(latest.date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    let totalFeatures = 0;
    let totalEnhancements = 0;
    let totalFixes = 0;

    releases.forEach((r) => {
      r.entries.forEach((e) => {
        if (e.category === 'feature') totalFeatures++;
        if (e.category === 'enhancement') totalEnhancements++;
        if (e.category === 'fix') totalFixes++;
      });
    });

    return {
      total,
      latestVersion: latest.version,
      lastDate,
      totalFeatures,
      totalEnhancements,
      totalFixes,
    };
  }, [releases]);

  const filteredReleases = useMemo(() => {
    if (!releases) return [];

    return releases
      .map((release, index) => {
        const serialNumber = releases.length - index;
        const formattedSerial = `Serial #${String(serialNumber).padStart(2, '0')}`;

        const matchingEntries = release.entries.filter((entry) => {
          // Category filter
          if (activeCategory !== 'all' && entry.category !== activeCategory) {
            return false;
          }
          // Search query filter
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const titleMatches = entry.title.toLowerCase().includes(query);
            const scopeMatches = entry.scope?.toLowerCase().includes(query);
            const versionMatches = release.version.toLowerCase().includes(query);
            const serialMatches = formattedSerial.toLowerCase().includes(query);

            return titleMatches || scopeMatches || versionMatches || serialMatches;
          }
          return true;
        });

        return {
          ...release,
          serialNumber,
          formattedSerial,
          isLatest: index === 0,
          filteredEntries: matchingEntries,
        };
      })
      .filter((release) => release.filteredEntries.length > 0);
  }, [releases, activeCategory, searchQuery]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 py-8">
        <div className="h-24 w-full animate-pulse rounded-2xl border border-border/60 bg-card/40" />
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
    <div className="mx-auto max-w-4xl space-y-8 md:space-y-12">
      {/* Metrics Summary Bar */}
      {metrics && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
          <div className="glass-card flex items-center gap-3.5 rounded-2xl border border-border/60 bg-card/50 p-4 transition-all hover:border-primary/30">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Layers className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t('statTotalReleases')}</p>
              <p className="text-lg font-bold tracking-tight">{metrics.total}</p>
            </div>
          </div>

          <div className="glass-card flex items-center gap-3.5 rounded-2xl border border-border/60 bg-card/50 p-4 transition-all hover:border-primary/30">
            <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Flame className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t('statLatestVersion')}</p>
              <p className="text-lg font-bold tracking-tight">{metrics.latestVersion}</p>
            </div>
          </div>

          <div className="glass-card flex items-center gap-3.5 rounded-2xl border border-border/60 bg-card/50 p-4 transition-all hover:border-primary/30">
            <div className="grid size-10 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
              <Calendar className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t('statLastUpdated')}</p>
              <p className="text-sm font-semibold tracking-tight">{metrics.lastDate}</p>
            </div>
          </div>

          <div className="glass-card flex items-center justify-between rounded-2xl border border-border/60 bg-card/50 p-4 transition-all hover:border-primary/30">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Changes</p>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-emerald-500">+{metrics.totalFeatures}</span>
                <span className="text-amber-500">⚡{metrics.totalEnhancements}</span>
                <span className="text-rose-500">🐛{metrics.totalFixes}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-card flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/40 p-4 backdrop-blur md:flex-row md:items-center md:justify-between">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="mr-1 size-4 text-muted-foreground hidden sm:block" />
          <button
            onClick={() => setActiveCategory('all')}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
              activeCategory === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            {t('filterAll')}
          </button>
          <button
            onClick={() => setActiveCategory('feature')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition-all ${
              activeCategory === 'feature'
                ? 'bg-emerald-500/20 text-emerald-500 font-semibold border border-emerald-500/30'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <Sparkles className="size-3 text-emerald-500" />
            {t('filterFeatures')}
          </button>
          <button
            onClick={() => setActiveCategory('enhancement')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition-all ${
              activeCategory === 'enhancement'
                ? 'bg-amber-500/20 text-amber-500 font-semibold border border-amber-500/30'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <Zap className="size-3 text-amber-500" />
            {t('filterEnhancements')}
          </button>
          <button
            onClick={() => setActiveCategory('fix')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition-all ${
              activeCategory === 'fix'
                ? 'bg-rose-500/20 text-rose-500 font-semibold border border-rose-500/30'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <Bug className="size-3 text-rose-500" />
            {t('filterFixes')}
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] md:w-64">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-xl border border-border/60 bg-background/60 py-1.5 pl-9 pr-8 text-xs placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Timeline Section */}
      {filteredReleases.length === 0 ? (
        <div className="mx-auto max-w-md rounded-2xl border border-border/60 bg-card/40 p-8 text-center backdrop-blur">
          <Search className="mx-auto size-8 text-muted-foreground/60" />
          <h4 className="mt-3 font-semibold">{t('noResultsTitle')}</h4>
          <p className="mt-1 text-xs text-muted-foreground">{t('noResultsDescription')}</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow"
          >
            {t('clearFilters')}
          </button>
        </div>
      ) : (
        <div className="relative space-y-10 md:space-y-14">
          {/* Vertical timeline spine line */}
          <div
            className="absolute bottom-4 left-4 top-4 hidden w-0.5 bg-gradient-to-b from-primary/60 via-primary/20 to-transparent md:left-6 md:block"
            aria-hidden
          />

          <StaggerReveal stagger={100}>
            {filteredReleases.map((release) => {
              const features = release.filteredEntries.filter((e) => e.category === 'feature');
              const enhancements = release.filteredEntries.filter((e) => e.category === 'enhancement');
              const fixes = release.filteredEntries.filter((e) => e.category === 'fix');

              const formattedDate = new Date(release.date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });

              return (
                <div key={release._id || release.version} className="relative md:pl-14">
                  {/* Timeline marker node (desktop) */}
                  <div
                    className={`absolute left-4 top-4 hidden size-5 -translate-x-1/2 rounded-full border-2 bg-background ring-4 ring-background md:grid md:place-items-center ${
                      release.isLatest ? 'border-primary ring-primary/20 shadow-lg shadow-primary/40' : 'border-border'
                    }`}
                    aria-hidden
                  >
                    <div className={`size-2 rounded-full ${release.isLatest ? 'bg-primary animate-pulse' : 'bg-muted-foreground/40'}`} />
                  </div>

                  {/* Release Card */}
                  <div
                    className={`glass-card relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                      release.isLatest
                        ? 'border-primary/40 bg-gradient-to-br from-card/80 via-card/60 to-primary/5 p-6 shadow-2xl shadow-primary/10 hover:border-primary/60 md:p-8'
                        : 'border-border/60 bg-card/60 p-6 shadow-xl shadow-primary/5 hover:border-primary/30 md:p-8'
                    }`}
                  >
                    {/* Glowing Accent Top Bar for Latest */}
                    {release.isLatest && (
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-emerald-400 to-accent-deep" />
                    )}

                    {/* Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
                      {/* Left: Version Tag & Serial Badge */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary via-primary-soft to-accent-deep px-3.5 py-1 text-xs font-bold tracking-wide text-primary-foreground shadow-md shadow-primary/20">
                          <Tag className="size-3.5" />
                          {t('version')} {release.version}
                        </span>

                        {/* Version Serial Badge */}
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-primary">
                          {release.formattedSerial}
                        </span>

                        {/* Latest Release Badge */}
                        {release.isLatest && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                            <Sparkles className="size-3" />
                            {t('latestBadge')}
                          </span>
                        )}
                      </div>

                      {/* Right: Date & Copy Button */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="size-3.5" />
                          <time dateTime={release.date}>{formattedDate}</time>
                        </div>

                        <button
                          onClick={() => handleCopy(release.version)}
                          title={t('copyTag')}
                          className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-muted/40 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                        >
                          {copiedVersion === release.version ? (
                            <>
                              <Check className="size-3 text-emerald-500" />
                              <span className="text-emerald-500 font-semibold">{t('copied')}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-3" />
                              <span>v{release.version}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Card Content: Grouped entries */}
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
      )}
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
