'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getChatSessions as apiGetChatSessions,
  deleteChatSession as apiDeleteChatSession,
  updateChatSessionTitle as apiUpdateChatSessionTitle,
  type ChatSession,
} from '@/lib/chat-session-api';

interface UseChatSessionsOptions {
  surface?: 'dashboard' | 'admin';
}

interface UseChatSessionsReturn {
  sessions: ChatSession[];
  isLoading: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  error: string | null;
  deleteSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, title: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
}

/**
 * Hook for managing the operator's chat session list. Session creation
 * happens server-side on the first message, so this only handles
 * listing, deleting, and renaming.
 */
export function useChatSessions(
  options: UseChatSessionsOptions = {},
): UseChatSessionsReturn {
  const { surface = 'admin' } = options;

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSessions = useCallback(async () => {
    try {
      setError(null);
      const data = await apiGetChatSessions(surface);
      setSessions(data.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, [surface]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      setIsDeleting(true);
      setError(null);
      await apiDeleteChatSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const renameSession = useCallback(async (sessionId: string, title: string) => {
    try {
      setError(null);
      const updated = await apiUpdateChatSessionTitle(sessionId, title);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename session');
    }
  }, []);

  useEffect(() => {
    void refreshSessions();
  }, [refreshSessions]);

  return {
    sessions,
    isLoading,
    isCreating,
    isDeleting,
    error,
    deleteSession,
    renameSession,
    refreshSessions,
  };
}
