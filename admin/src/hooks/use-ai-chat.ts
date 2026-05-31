'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { streamChatRequest } from '@/lib/ai/client';
import { parseChartsFromText } from '@/lib/ai/parse-chart';
import type { ChatMessage } from '@/lib/ai/types';

/**
 * Stateful wrapper around `/api/ai/chat`. See `client/src/hooks/use-ai-chat.ts`
 * for the original — this is the admin copy with the same semantics.
 */
export interface UseAiChatOptions {
  greeting?: string;
  surface?: 'landing' | 'dashboard' | 'admin';
  buildContext?: () => string | undefined;
  endpoint?: string;
}

export interface UseAiChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  send: (text: string) => void;
  abort: () => void;
  reset: () => void;
}

let messageCounter = 0;
const newId = () => {
  messageCounter += 1;
  return `m_${Date.now().toString(36)}_${messageCounter}`;
};

export function useAiChat(options: UseAiChatOptions = {}): UseAiChatReturn {
  const { greeting, surface = 'admin', buildContext, endpoint } = options;

  const initial = useMemo<ChatMessage[]>(() => {
    if (!greeting) return [];
    return [
      {
        id: newId(),
        role: 'assistant',
        content: greeting,
        createdAt: new Date().toISOString(),
      },
    ];
  }, [greeting]);

  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMessages(initial);
    setError(null);
  }, [initial]);

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

      const run = async () => {
        try {
          const stream = streamChatRequest(
            { messages: outgoing, context: buildContext?.(), surface },
            { signal: controller.signal, endpoint },
          );

          for await (const event of stream) {
            if (event.type === 'delta') {
              buffered += event.text;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: buffered } : m)),
              );
            } else if (event.type === 'done') {
              const finalText = event.text || buffered;
              finalize(assistantId, finalText);
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
    [messages, isStreaming, buildContext, surface, endpoint, finalize],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages(initial);
    setError(null);
  }, [initial]);

  return { messages, isStreaming, error, send, abort, reset };
}
