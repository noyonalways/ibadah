/**
 * Browser-side helper for talking to `/api/ai/chat`. Wraps the
 * fetch-based SSE parser into an async iterable so callers (the
 * `useAiChat` hook, primarily) can `for await (...)` over events.
 *
 * Why not `EventSource`? Because it's GET-only. We POST the
 * conversation, so we have to parse the SSE frames manually.
 */
import type { ChatRequestBody, StreamEvent } from './types';

export const AI_CHAT_ENDPOINT = '/api/ai/chat';

export interface StreamChatOptions {
  endpoint?: string;
  signal?: AbortSignal;
}

export async function* streamChatRequest(
  body: ChatRequestBody,
  options: StreamChatOptions = {},
): AsyncIterable<StreamEvent> {
  const res = await fetch(options.endpoint ?? AI_CHAT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(body),
    signal: options.signal,
  });

  if (!res.ok || !res.body) {
    let message = `Chat request failed (${res.status})`;
    try {
      const json = (await res.json()) as { message?: string };
      if (json?.message) message = json.message;
    } catch {
      /* fallthrough */
    }
    yield { type: 'error', message };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let sep: number;
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const event = parseFrame(frame);
        if (event) yield event;
      }
    }

    const trailing = buffer.trim();
    if (trailing) {
      const event = parseFrame(trailing);
      if (event) yield event;
    }
  } finally {
    reader.releaseLock();
  }
}

function parseFrame(frame: string): StreamEvent | null {
  const dataLines: string[] = [];
  for (const line of frame.split('\n')) {
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
  }
  if (dataLines.length === 0) return null;
  try {
    return JSON.parse(dataLines.join('\n')) as StreamEvent;
  } catch {
    return null;
  }
}
