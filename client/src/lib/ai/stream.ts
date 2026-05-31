/**
 * Server-side helpers for converting an `AsyncIterable<string>` (the
 * provider's text deltas) into a `ReadableStream` of SSE-style events
 * that the browser can consume.
 *
 * Wire format:
 *
 *   data: {"type":"delta","text":"Hello"}\n\n
 *   data: {"type":"delta","text":", world"}\n\n
 *   data: {"type":"done","text":"Hello, world"}\n\n
 *
 * Errors:
 *
 *   data: {"type":"error","message":"..."}\n\n
 *
 * The browser's `EventSource` API can't be used because it doesn't
 * support POST. Callers use `fetch` + manual parsing instead — see
 * `client.ts`.
 */
import type { StreamEvent } from './types';

const ENC = new TextEncoder();

function encodeEvent(ev: StreamEvent): Uint8Array {
  return ENC.encode(`data: ${JSON.stringify(ev)}\n\n`);
}

export function eventStreamHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    // Disable buffering on common reverse proxies (Nginx).
    'X-Accel-Buffering': 'no',
  };
}

interface CreateStreamArgs {
  source: AsyncIterable<string>;
  /** Called when the stream ends successfully with the full text. */
  onDone?: (fullText: string) => void;
  /** Optional cancel signal — passes through to the iterator. */
  signal?: AbortSignal;
}

/**
 * Pump deltas from `source` into a ReadableStream. Catches throws
 * inside the iterator and surfaces them as a final `error` event so
 * the browser always sees a clean termination.
 */
export function createSseStream(args: CreateStreamArgs): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = '';
      try {
        if (args.signal?.aborted) {
          controller.enqueue(encodeEvent({ type: 'error', message: 'aborted' }));
          controller.close();
          return;
        }

        for await (const delta of args.source) {
          if (args.signal?.aborted) break;
          if (!delta) continue;
          full += delta;
          controller.enqueue(encodeEvent({ type: 'delta', text: delta }));
        }

        controller.enqueue(encodeEvent({ type: 'done', text: full }));
        args.onDone?.(full);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown error';
        controller.enqueue(encodeEvent({ type: 'error', message }));
      } finally {
        controller.close();
      }
    },
  });
}
