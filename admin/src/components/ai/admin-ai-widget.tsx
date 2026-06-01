'use client';

import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { AIWidget } from './ai-widget';

/**
 * Admin-flavored wrapper around `<AIWidget>`. Responsibilities:
 *
 *   1. Hide the floating launcher on the dedicated `/assistant` page
 *      so it doesn't double up on the full-page chat there.
 *   2. Pull whatever the dashboard / analytics queries already cached
 *      and inject a compact JSON snapshot as context, so the model
 *      can ground its answers in real numbers without us re-fetching.
 *
 * The admin app has no mobile bottom nav, so we always use the
 * `liftAboveBottomNav={false}` placement.
 */
export function AdminAIWidget() {
  const pathname = usePathname();
  const qc = useQueryClient();

  const hidden = /^\/assistant(\/|$)/.test(pathname);

  const buildContext = useCallback((): string | undefined => {
    const all = qc.getQueryCache().getAll();

    // /admin/dashboard (one-shot snapshot used by the dashboard page).
    const dashboard = all.find(
      (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'admin' && q.queryKey[1] === 'dashboard',
    )?.state.data as
      | {
          generatedAt?: string;
          health?: { status?: string; uptime?: number; db?: { state?: string } };
          metrics?: {
            users?: { total?: number; newLast7d?: number; newLast30d?: number };
            active?: { dau?: number; wau?: number; mau?: number };
          };
          analytics?: {
            range?: { days?: number };
            pillars?: Record<string, { totalPoints?: number }>;
          };
          moderation?: { pending?: number; approved?: number; hidden?: number; removed?: number };
        }
      | undefined;

    if (!dashboard) return undefined;

    // Compact summary — keep the prompt small. Pillars/totalPoints
    // collapsed into a single map.
    const pillarTotals: Record<string, number> = {};
    if (dashboard.analytics?.pillars) {
      for (const [key, value] of Object.entries(dashboard.analytics.pillars)) {
        if (value && typeof value.totalPoints === 'number') {
          pillarTotals[key] = value.totalPoints;
        }
      }
    }

    const snapshot = {
      generatedAt: dashboard.generatedAt ?? null,
      health: {
        status: dashboard.health?.status ?? null,
        uptimeSec: dashboard.health?.uptime ?? null,
        dbState: dashboard.health?.db?.state ?? null,
      },
      users: {
        total: dashboard.metrics?.users?.total ?? null,
        newLast7d: dashboard.metrics?.users?.newLast7d ?? null,
        newLast30d: dashboard.metrics?.users?.newLast30d ?? null,
      },
      active: {
        dau: dashboard.metrics?.active?.dau ?? null,
        wau: dashboard.metrics?.active?.wau ?? null,
        mau: dashboard.metrics?.active?.mau ?? null,
      },
      analytics: {
        rangeDays: dashboard.analytics?.range?.days ?? null,
        pillarTotalPoints: pillarTotals,
      },
      moderation: {
        pending: dashboard.moderation?.pending ?? null,
        approved: dashboard.moderation?.approved ?? null,
        hidden: dashboard.moderation?.hidden ?? null,
        removed: dashboard.moderation?.removed ?? null,
      },
    };

    return JSON.stringify(snapshot);
  }, [qc]);

  return (
    <AIWidget
      hidden={hidden}
      surface="admin"
      buildContext={buildContext}
      liftAboveBottomNav={false}
      greeting="Hi — I'm the Ibadah admin copilot. Ask about any page, paste metrics for a chart, or describe a question and I'll point you at the right endpoint."
      suggestions={[
        'Summarize today’s health snapshot',
        'Chart DAU vs WAU vs MAU',
        'Where do I find the audit log?',
      ]}
    />
  );
}
