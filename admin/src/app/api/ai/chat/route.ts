/**
 * Streaming chat endpoint for the admin panel. Identical wire format
 * to the client's `/api/ai/chat` (provider-agnostic, SSE), but always
 * uses the admin persona — even if the request body claims otherwise.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getAiConfig, AiConfigError } from '@/lib/ai/config';
import { createProvider } from '@/lib/ai/providers';
import { createSseStream, eventStreamHeaders } from '@/lib/ai/stream';
import { getSystemPrompt } from '@/lib/ai/system-prompt';
import type { ChatMessage } from '@/lib/ai/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const messageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1).max(8000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
  context: z.string().max(8000).optional(),
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

  // Always use the admin persona on this app — the surface field in
  // the body is ignored as a security tightening.
  const systemMessages: ChatMessage[] = [{ role: 'system', content: getSystemPrompt('admin') }];
  if (parsed.context && parsed.context.trim().length > 0) {
    systemMessages.push({
      role: 'system',
      content: `Operator context (read-only):\n${parsed.context.trim()}`,
    });
  }

  const userMessages = parsed.messages.filter((m) => m.role !== 'system');
  const merged: ChatMessage[] = [...systemMessages, ...userMessages];

  const provider = createProvider(config);
  const upstreamAbort = new AbortController();
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
