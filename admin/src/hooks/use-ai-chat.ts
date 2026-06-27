'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { streamAdminChat } from '@/lib/ai-api';
import { parseChartsFromText } from '@/lib/ai/parse-chart';
import type { ChatMessage, ToolActivity } from '@/lib/ai/types';
import { getChatSession } from '@/lib/chat-session-api';

/**
 * Stateful wrapper around the admin `/ai/admin/chat` endpoint. Mirrors
 * `client/src/hooks/use-ai-chat.ts`:
 *
 *   - Optimistic insertion of the user's message.
 *   - Streaming the assistant reply token-by-token.
 *   - Parsing fenced ```chart``` blocks out of the final text.
 *   - Loading + persisting chat history via server-side sessions.
 */
export interface UseAiChatOptions {
  greeting?: string;
  surface?: 'landing' | 'dashboard' | 'admin';
  buildContext?: () => string | undefined;
  endpoint?: string;
  /** Existing session ID to load messages from, or undefined for new chat. */
  sessionId?: string | null;
  /** Callback when a new session is created (provides the session ID). */
  onSessionCreated?: (sessionId: string) => void;
  /** Fired after each completed turn so callers can refresh history. */
  onTurnComplete?: () => void;
}

export interface UseAiChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  send: (text: string) => void;
  abort: () => void;
  reset: () => void;
  sessionId: string | null;
  setSessionId: (sessionId: string | null) => void;
}

let messageCounter = 0;
const newId = () => {
  messageCounter += 1;
  return `m_${Date.now().toString(36)}_${messageCounter}`;
};

const greetingMessage = (greeting?: string): ChatMessage[] =>
  greeting
    ? [{ id: newId(), role: 'assistant', content: greeting, createdAt: new Date().toISOString() }]
    : [];

export function useAiChat(options: UseAiChatOptions = {}): UseAiChatReturn {
  const {
    greeting,
    buildContext,
    sessionId: initialSessionId,
    onSessionCreated,
    onTurnComplete,
  } = options;

  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Load prior messages when mounted with an existing session.
  useEffect(() => {
    if (isInitialized) return;

    if (!initialSessionId) {
      setMessages(greetingMessage(greeting));
      setIsInitialized(true);
      return;
    }

    let cancelled = false;
    const loadSession = async () => {
      try {
        const data = await getChatSession(initialSessionId);
        if (cancelled) return;
        const loaded = data.messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            createdAt: m.createdAt,
          }));
        setMessages(loaded.length > 0 ? loaded : greetingMessage(greeting));
      } catch {
        if (!cancelled) setMessages(greetingMessage(greeting));
      } finally {
        if (!cancelled) setIsInitialized(true);
      }
    };

    void loadSession();
    return () => {
      cancelled = true;
    };
  }, [initialSessionId, greeting, isInitialized]);

  const finalize = useCallback((id: string, raw: string) => {
    const parsed = parseChartsFromText(raw);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              content: parsed.text || raw,
              charts: parsed.charts.length > 0 ? parsed.charts : undefined,
              createdAt: new Date().toISOString(),
            }
          : m,
      ),
    );
  }, []);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      const startSessionId = sessionId;

      const userMsg: ChatMessage = {
        id: newId(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      const assistantId = newId();
      const assistantMsg: ChatMessage = { id: assistantId, role: 'assistant', content: '' };

      const outgoing = [...messages, userMsg].map(({ role, content }) => ({ role, content }));

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      let buffered = '';
      const toolActivity: ToolActivity[] = [];

      const run = async () => {
        try {
          const stream = streamAdminChat(
            { messages: outgoing, context: buildContext?.(), sessionId: startSessionId },
            { signal: controller.signal },
          );

          for await (const event of stream) {
            if (event.type === 'session') {
              setSessionId(event.sessionId);
              if (event.sessionId !== startSessionId) {
                onSessionCreated?.(event.sessionId);
              }
            } else if (event.type === 'delta') {
              buffered += event.text;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: buffered } : m)),
              );
            } else if (event.type === 'tool_call') {
              toolActivity.push({ name: event.tool, status: 'running' });
              const snapshot = [...toolActivity];
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, tools: snapshot } : m)),
              );
            } else if (event.type === 'tool_result') {
              const entry = [...toolActivity].reverse().find(
                (t) => t.name === event.tool && t.status === 'running',
              );
              if (entry) entry.status = event.ok ? 'done' : 'error';
              const snapshot = [...toolActivity];
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, tools: snapshot } : m)),
              );
            } else if (event.type === 'done') {
              const finalText = event.text || buffered;
              finalize(assistantId, finalText);
              onTurnComplete?.();
              return;
            } else if (event.type === 'error') {
              setError(event.message);
              finalize(
                assistantId,
                buffered
                  ? `${buffered}\n\n_(stream interrupted: ${event.message})_`
                  : `_Sorry — I couldn't complete that response._\n\n${event.message}`,
              );
              return;
            }
          }

          finalize(assistantId, buffered);
        } catch (err) {
          if (controller.signal.aborted) {
            finalize(assistantId, buffered ? `${buffered}\n\n_(canceled)_` : '_Canceled._');
            return;
          }
          const message = err instanceof Error ? err.message : 'Unknown error';
          setError(message);
          finalize(
            assistantId,
            buffered
              ? `${buffered}\n\n_(stream interrupted: ${message})_`
              : `_Sorry — I couldn't reach the assistant._\n\n${message}`,
          );
        } finally {
          setIsStreaming(false);
          abortRef.current = null;
        }
      };

      void run();
    },
    [messages, isStreaming, buildContext, finalize, sessionId, onSessionCreated, onTurnComplete],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages(greetingMessage(greeting));
    setError(null);
    setIsInitialized(false);
  }, [greeting]);

  return { messages, isStreaming, error, send, abort, reset, sessionId, setSessionId };
}
