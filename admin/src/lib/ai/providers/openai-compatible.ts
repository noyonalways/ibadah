/**
 * Shared streaming logic for any OpenAI-compatible Chat Completions
 * endpoint (OpenAI itself + OpenRouter). They share the request body
 * (`{model, messages, stream, ...}`), share the response framing
 * (Server-Sent Events with `data: <json>` lines), and share the
 * `[DONE]` sentinel — so adapter code is identical apart from the
 * URL and headers.
 *
 * The adapter:
 *   1. POSTs the request with `stream: true`.
 *   2. Reads the response body as a UTF-8 stream.
 *   3. Splits on blank lines (SSE event boundary).
 *   4. For each `data:` line, parses the JSON and yields
 *      `choices[0].delta.content` if present.
 *   5. Stops on the `[DONE]` sentinel or when the stream closes.
 */
import type { ChatMessage } from '../types';

interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function toOpenAiMessages(messages: ChatMessage[]): OpenAiMessage[] {
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

interface StreamArgs {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
  signal?: AbortSignal;
}

export async function* streamOpenAiCompatible(args: StreamArgs): AsyncIterable<string> {
  const res = await fetch(args.url, {
    method: 'POST',
    headers: args.headers,
    body: JSON.stringify(args.body),
    signal: args.signal,
  });

  if (!res.ok || !res.body) {
    const text = await safeReadText(res);
    throw new Error(
      `Upstream chat completion failed (${res.status} ${res.statusText}): ${text.slice(0, 500)}`,
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

      // SSE frames are separated by a blank line. Process whole frames
      // and keep the trailing partial in the buffer.
      let sep: number;
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const piece = parseSseFrame(frame);
        if (piece === null) continue;
        if (piece === '[DONE]') return;
        yield piece;
      }
    }

    // Flush any final frame that didn't end with a blank line.
    const trailing = buffer.trim();
    if (trailing) {
      const piece = parseSseFrame(trailing);
      if (piece && piece !== '[DONE]') yield piece;
    }
  } finally {
    reader.releaseLock();
  }
}

function parseSseFrame(frame: string): string | null {
  // A frame may contain comments (`:`) or multiple `data:` lines (per
  // SSE spec, you concatenate them). Anything that isn't a `data:`
  // line is ignored.
  const dataLines: string[] = [];
  for (const line of frame.split('\n')) {
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  if (dataLines.length === 0) return null;

  const payload = dataLines.join('\n');
  if (payload === '[DONE]') return '[DONE]';

  try {
    const obj = JSON.parse(payload) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    return obj.choices?.[0]?.delta?.content ?? '';
  } catch {
    return null;
  }
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}
