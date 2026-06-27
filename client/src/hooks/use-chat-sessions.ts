'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getChatSessions as apiGetChatSessions,
  createChatSession as apiCreateChatSession,
  deleteChatSession as apiDeleteChatSession,
  getChatSession as apiGetChatSession,
  updateChatSessionTitle as apiUpdateChatSessionTitle,
  type ChatSession,
  type ChatSessionWithMessages,
} from '@/lib/chat-session-api';
import type { ChatMessage as ChatMessageType } from '@/lib/ai/types';

interface UseChatSessionsOptions {
  surface?: 'dashboard' | 'admin';
  initialSessionId?: string | null;
}

interface UseChatSessionsReturn {
  sessions: ChatSession[];
  activeSession: ChatSessionWithMessages | null;
  activeSessionId: string | null;
  isLoading: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  error: string | null;
  createSession: () => Promise<ChatSessionWithMessages | null>;
  selectSession: (sessionId: string | null) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, title: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
  clearSelection: () => void;
}

/**
 * Hook for managing chat sessions - listing, creating, and selecting sessions
 */
export function useChatSessions(
  options: UseChatSessionsOptions = {},
): UseChatSessionsReturn {
  const { surface = 'dashboard', initialSessionId = null } = options;

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(initialSessionId);
  const [activeSession, setActiveSession] = useState<ChatSessionWithMessages | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSessions = useCallback(async () => {
    try {
      setError(null);
      const data = await apiGetChatSessions(surface);
      setSessions(data.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    }
  }, [surface]);

  const selectSession = useCallback(async (sessionId: string | null) => {
    if (!sessionId) {
      setActiveSessionId(null);
      setActiveSession(null);
      return;
    }

    try {
      setError(null);
      const session = await apiGetChatSession(sessionId);
      setActiveSessionId(sessionId);
      setActiveSession(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session');
    }
  }, []);

  const createSession = useCallback(async (): Promise<ChatSessionWithMessages | null> => {
    try {
      setIsCreating(true);
      setError(null);
      const session = await apiCreateChatSession(surface);
      setSessions((prev) => [session, ...prev]);
      setActiveSessionId(session.id);

      // Load the full session with messages (empty for new session)
      const fullSession: ChatSessionWithMessages = {
        ...session,
        messages: [],
      };
      setActiveSession(fullSession);
      return fullSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [surface]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      setIsDeleting(true);
      setError(null);
      await apiDeleteChatSession(sessionId);

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));

      // If we deleted the active session, clear selection
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setActiveSession(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
    } finally {
      setIsDeleting(false);
    }
  }, [activeSessionId]);

  const renameSession = useCallback(async (sessionId: string, title: string) => {
    try {
      setError(null);
      const updated = await apiUpdateChatSessionTitle(sessionId, title);

      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? updated : s)),
      );

      if (activeSession && activeSession.id === sessionId) {
        setActiveSession((prev) => (prev ? { ...prev, title: updated.title } : null));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename session');
    }
  }, [activeSession]);

  const clearSelection = useCallback(() => {
    setActiveSessionId(null);
    setActiveSession(null);
  }, []);

  // Load sessions on mount
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  // Load initial session if provided (must be admin or dashboard surface)
  useEffect(() => {
    if (initialSessionId) {
      selectSession(initialSessionId);
    }
  }, [initialSessionId, selectSession]);

  return {
    sessions,
    activeSession,
    activeSessionId,
    isLoading,
    isCreating,
    isDeleting,
    error,
    createSession,
    selectSession,
    deleteSession,
    renameSession,
    refreshSessions,
    clearSelection,
  };
}