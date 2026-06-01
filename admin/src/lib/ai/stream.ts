/**
 * Server-side helpers for converting the provider's text deltas into
 * an SSE-style stream. Identical to the client copy.
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
    'X-Accel-Buffering': 'no',
  };
}

interface CreateStreamArgs {
  source: AsyncIterable<string>;
  onDone?: (fullText: string) => void;
  signal?: AbortSignal;
}

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
