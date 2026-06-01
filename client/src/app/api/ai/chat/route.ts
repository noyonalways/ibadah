/**
 * Streaming chat endpoint. Hard requirements:
 *
 *   - Server-side only — never returns the API key.
 *   - Provider-agnostic — picks the active provider from env via
 *     `getAiConfig()`. The browser never sends the provider/model.
 *   - Streams `text/event-stream` so the widget can render tokens as
 *     they arrive.
 *
 * Request body:
 *
 *   {
 *     messages: [{role: 'user'|'assistant', content: '...'}, ...],
 *     context?: '...',                 // injected after the system prompt
 *     surface?: 'landing'|'dashboard'  // selects which system persona
 *   }
 *
 * Response (success): SSE stream — see `lib/ai/stream.ts`.
 * Response (error):   plain JSON `{success:false, message}` with a
 *                     non-2xx status, matching the rest of the API.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getAiConfig, AiConfigError } from '@/lib/ai/config';
import { createProvider } from '@/lib/ai/providers';
import { createSseStream, eventStreamHeaders } from '@/lib/ai/stream';
import { getSystemPrompt, type SystemSurface } from '@/lib/ai/system-prompt';
import type { ChatMessage } from '@/lib/ai/types';

// Streaming responses don't play well with edge caching — keep it on
// the Node runtime so the SSE write loop runs uninterrupted.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1).max(8000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
  context: z.string().max(4000).optional(),
  surface: z.enum(['landing', 'dashboard', 'admin']).optional(),
});

export async function POST(req: Request) {
  let parsed: z.infer<typeof bodySchema>;
  try {
    const json = await req.json();
    parsed = bodySchema.parse(json);
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message:
          err instanceof z.ZodError
            ? err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
            : 'Invalid request body',
      },
      { status: 400 },
    );
  }

  let config;
  try {
    config = getAiConfig();
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message:
          err instanceof AiConfigError
            ? err.message
            : 'AI is not configured on this server.',
      },
      { status: 503 },
    );
  }

  const surface: SystemSurface = parsed.surface ?? 'dashboard';
  const systemMessages: ChatMessage[] = [{ role: 'system', content: getSystemPrompt(surface) }];
  if (parsed.context && parsed.context.trim().length > 0) {
    systemMessages.push({
      role: 'system',
      content: `User context (read-only):\n${parsed.context.trim()}`,
    });
  }

  // Strip any `system` messages the client tried to inject — the
  // system prompt is server-controlled.
  const userMessages = parsed.messages.filter((m) => m.role !== 'system');
  const merged: ChatMessage[] = [...systemMessages, ...userMessages];

  const provider = createProvider(config);
  const upstreamAbort = new AbortController();
  // Cancel the upstream call if the browser disconnects.
  req.signal.addEventListener('abort', () => upstreamAbort.abort(), { once: true });

  const source = provider.streamChat({
    messages: merged,
    model: config.model,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
    signal: upstreamAbort.signal,
  });

  const stream = createSseStream({ source, signal: req.signal });
  return new Response(stream, { headers: eventStreamHeaders() });
}
