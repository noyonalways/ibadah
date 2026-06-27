'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { streamClientChat, streamAdminChat } from '@/lib/ai-api';
import { parseChartsFromText } from '@/lib/ai/parse-chart';
import type { ChatMessage, ToolActivity } from '@/lib/ai/types';
import { getChatSession } from '@/lib/chat-session-api';

/**
 * Stateful wrapper around `/api/ai/chat`. Handles:
 *
 *   - Optimistic insertion of the user's message.
 *   - Streaming the assistant reply token-by-token.
 *   - Parsing fenced ```chart``` blocks out of the final text and
 *     attaching them as structured ChartSpecs on the message.
 *   - Cancellation via the returned `abort()` function.
 *   - Error surfacing via a flat `error` string.
 *   - Session persistence for chat history.
 *
 * The hook is intentionally headless — both the floating widget and
 * the dedicated `/assistant` page share it and render their own UI.
 */
export interface UseAiChatOptions {
  /**
   * Initial assistant greeting shown before the conversation starts.
   * Treated as a real assistant turn so the system prompt sees it on
   * subsequent calls — the model can reference its own greeting.
   */
  greeting?: string;
  /** System surface — selects the right persona on the server. */
  surface?: 'landing' | 'dashboard' | 'admin';
  /**
   * Optional dynamic context injected on every request (e.g. a JSON
   * blob of the user's recent stats). Re-evaluated per send so it
   * always reflects the latest state.
   */
  buildContext?: () => string | undefined;
  /** Override the chat endpoint; defaults to `/api/ai/chat`. */
  endpoint?: string;
  /** Existing session ID to load messages from, or undefined for new chat */
  sessionId?: string | null;
  /** Callback when a new session is created (provides the session ID) */
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

export function useAiChat(options: UseAiChatOptions = {}): UseAiChatReturn {
  const { greeting, surface = 'dashboard', buildContext, endpoint, sessionId: initialSessionId, onSessionCreated, onTurnComplete } = options;

  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Load session messages when sessionId changes
  useEffect(() => {
    if (!initialSessionId || isInitialized) return;

    const loadSession = async () => {
      try {
        const sessionData = await getChatSession(initialSessionId);
        const loadedMessages = sessionData.messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            createdAt: m.createdAt,
          }));
        setMessages(loadedMessages.length > 0 ? loadedMessages : (greeting ? [{ id: newId(), role: 'assistant', content: greeting, createdAt: new Date().toISOString() }] : []));
        setIsInitialized(true);
      } catch {
        // If session doesn't exist, start fresh
        setMessages(greeting ? [{ id: newId(), role: 'assistant', content: greeting, createdAt: new Date().toISOString() }] : []);
        setIsInitialized(true);
      }
    };

    loadSession();
  }, [initialSessionId, greeting, isInitialized]);

  // Initialize empty state when no session
  useEffect(() => {
    if (!initialSessionId && !isInitialized) {
      setMessages(greeting ? [{ id: newId(), role: 'assistant', content: greeting, createdAt: new Date().toISOString() }] : []);
      setIsInitialized(true);
    }
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
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      setError(null);

      // The session is created/resolved server-side; we just thread the
      // current id (if any) and learn the assigned id from a `session`
      // event on the stream.
      const startSessionId = sessionId;

      const userMsg: ChatMessage = {
        id: newId(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      const assistantId = newId();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
      };

      // Snapshot the *outgoing* history so the request matches the
      // optimistic UI (state setters are async).
      const outgoing = [...messages, userMsg].map(({ role, content }) => ({ role, content }));

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      let buffered = '';
      const toolActivity: ToolActivity[] = [];

      const run = async () => {
        try {
          // Choose the right streaming function based on surface
          const stream = surface === 'admin'
            ? streamAdminChat({ messages: outgoing, context: buildContext?.(), sessionId: startSessionId }, { signal: controller.signal })
            : streamClientChat({ messages: outgoing, context: buildContext?.(), surface, sessionId: startSessionId }, { signal: controller.signal });

          for await (const event of stream) {
            if (event.type === 'session') {
              // Server assigned (or confirmed) the persisted session id.
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
              // Keep whatever partial text the model managed to emit;
              // append a tiny suffix so the failure is visible inline.
              finalize(
                assistantId,
                buffered
                  ? `${buffered}\n\n_(stream interrupted: ${event.message})_`
                  : `_Sorry — I couldn't complete that response._\n\n${event.message}`,
              );
              return;
            }
          }

          // Stream ended without a `done` event — finalize whatever we got.
          finalize(assistantId, buffered);
        } catch (err) {
          if (controller.signal.aborted) {
            finalize(
              assistantId,
              buffered ? `${buffered}\n\n_(canceled)_` : '_Canceled._',
            );
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
    [messages, isStreaming, buildContext, surface, finalize, sessionId, onSessionCreated, onTurnComplete],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages(greeting ? [{ id: newId(), role: 'assistant', content: greeting, createdAt: new Date().toISOString() }] : []);
    setError(null);
    setIsInitialized(false);
  }, [greeting]);

  return { messages, isStreaming, error, send, abort, reset, sessionId, setSessionId };
}