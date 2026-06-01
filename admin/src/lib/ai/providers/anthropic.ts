/**
 * Anthropic provider — uses the Messages API at
 * `https://api.anthropic.com/v1/messages` with `stream: true`.
 *
 * Anthropic emits SSE events of several types:
 *   - `message_start`   — opening event with the message envelope.
 *   - `content_block_start` / `content_block_delta` / `content_block_stop`
 *                       — per content block. We only care about
 *                         `text_delta` deltas.
 *   - `message_delta`   — usage / stop reason updates.
 *   - `message_stop`    — final event.
 *
 * Reference: https://docs.anthropic.com/en/api/messages-streaming
 */
import type { AiConfig } from '../config';
import type { ChatMessage, ChatProvider, ProviderChatInput } from '../types';

const ANTHROPIC_BASE = 'https://api.anthropic.com/v1';
const API_VERSION = '2023-06-01';

export function createAnthropicProvider(config: AiConfig): ChatProvider {
  return {
    name: 'anthropic',
    async *streamChat(input: ProviderChatInput): AsyncIterable<string> {
      const { system, messages } = splitSystem(input.messages);

      const res = await fetch(`${ANTHROPIC_BASE}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': API_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: input.model,
          // Anthropic caps `max_tokens` per model — clamp safely.
          max_tokens: Math.max(64, Math.min(input.maxTokens ?? 1024, 4096)),
          temperature: input.temperature,
          system: system || undefined,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          stream: true,
        }),
        signal: input.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        throw new Error(
          `Anthropic stream failed (${res.status} ${res.statusText}): ${text.slice(0, 500)}`,
        );
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
            const delta = parseFrame(frame);
            if (delta) yield delta;
          }
        }

        const trailing = buffer.trim();
        if (trailing) {
          const delta = parseFrame(trailing);
          if (delta) yield delta;
        }
      } finally {
        reader.releaseLock();
      }
    },
  };
}

function parseFrame(frame: string): string {
  // We only need `data:` lines; the `event:` line is informational.
  const dataLines: string[] = [];
  for (const line of frame.split('\n')) {
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
  }
  if (dataLines.length === 0) return '';

  try {
    const obj = JSON.parse(dataLines.join('\n')) as {
      type?: string;
      delta?: { type?: string; text?: string };
    };
    if (obj.type === 'content_block_delta' && obj.delta?.type === 'text_delta') {
      return obj.delta.text ?? '';
    }
  } catch {
    /* ignore malformed frames */
  }
  return '';
}

/**
 * Anthropic takes the system prompt as a top-level `system` field, not
 * a message. Pull any leading system messages out of the array and
 * concatenate them.
 */
function splitSystem(messages: ChatMessage[]): {
  system: string;
  messages: ChatMessage[];
} {
  const systems: string[] = [];
  const rest: ChatMessage[] = [];
  for (const m of messages) {
    if (m.role === 'system') systems.push(m.content);
    else rest.push(m);
  }
  return { system: systems.join('\n\n'), messages: rest };
}
