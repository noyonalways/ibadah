'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';

import { PageHeader } from '@/components/admin/page-header';
import { AIPanel } from '@/components/ai/ai-panel';
import { ChatHistorySidebar } from '@/components/ai/chat-history-sidebar';
import { useChatSessions } from '@/hooks/use-chat-sessions';

/**
 * Full-page admin assistant. Reuses the same `<AIPanel>` as the
 * floating widget, just bigger so operators have room to read tables
 * and inline charts. The widget hides itself on this route.
 */
export default function AdminAssistantPage() {
  const t = useTranslations('Assistant');
  const qc = useQueryClient();

  const {
    sessions,
    isLoading,
    isCreating,
    isDeleting,
    error,
    deleteSession,
    renameSession,
    refreshSessions,
  } = useChatSessions({ surface: 'admin' });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [panelKey, setPanelKey] = useState(0);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
    setPanelKey((k) => k + 1);
  }, []);

  const handleNewSession = useCallback(() => {
    setActiveSessionId(null);
    setPanelKey((k) => k + 1);
  }, []);

  const handleSessionCreated = useCallback(
    (id: string) => {
      setActiveSessionId(id);
      void refreshSessions();
    },
    [refreshSessions],
  );

  const handleTurnComplete = useCallback(() => {
    void refreshSessions();
  }, [refreshSessions]);

  const handleDeleteSession = useCallback(
    async (id: string) => {
      await deleteSession(id);
      if (id === activeSessionId) {
        setActiveSessionId(null);
        setPanelKey((k) => k + 1);
      }
    },
    [deleteSession, activeSessionId],
  );

  const buildContext = useCallback((): string | undefined => {
    const all = qc.getQueryCache().getAll();
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
          analytics?: { range?: { days?: number }; pillars?: Record<string, { totalPoints?: number }> };
          moderation?: { pending?: number; approved?: number; hidden?: number; removed?: number };
        }
      | undefined;

    if (!dashboard) return undefined;

    const pillarTotals: Record<string, number> = {};
    if (dashboard.analytics?.pillars) {
      for (const [key, value] of Object.entries(dashboard.analytics.pillars)) {
        if (value && typeof value.totalPoints === 'number') {
          pillarTotals[key] = value.totalPoints;
        }
      }
    }

    return JSON.stringify({
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
    });
  }, [qc]);

  return (
    <>
      <PageHeader
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        actions={
          <span className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline-flex">
            <Sparkles className="size-3.5 text-primary" />
            {t('badge')}
          </span>
        }
      />

      <div className="flex h-[calc(100dvh-12rem)] min-h-[480px] overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-sm backdrop-blur">
        <ChatHistorySidebar
          className="hidden md:flex"
          sessions={sessions}
          activeSessionId={activeSessionId}
          isLoading={isLoading}
          isCreating={isCreating}
          isDeleting={isDeleting}
          error={error}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          onRenameSession={renameSession}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <AIPanel
            key={panelKey}
            surface="admin"
            sessionId={activeSessionId}
            onSessionCreated={handleSessionCreated}
            onTurnComplete={handleTurnComplete}
            buildContext={buildContext}
            density="comfortable"
            autoFocus
            greeting={t('greeting')}
            suggestions={[
              t('suggest_health'),
              t('suggest_engagement'),
              t('suggest_endpoint'),
              t('suggest_moderation'),
            ]}
          />
        </div>
      </div>
    </>
  );
}
