/**
 * Google Gemini provider — uses the `generateContent` API with the
 * `streamGenerateContent` variant for incremental output.
 *
 * Endpoint:
 *   POST https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key={KEY}
 *
 * Each SSE frame contains a JSON object whose first candidate's first
 * part holds the text delta:
 *   {"candidates":[{"content":{"parts":[{"text":"..."}]}}]}
 *
 * Reference: https://ai.google.dev/api/generate-content#method:-models.streamgeneratecontent
 */
import type { AiConfig } from '../config';
import type { ChatMessage, ChatProvider, ProviderChatInput } from '../types';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export function createGeminiProvider(config: AiConfig): ChatProvider {
  return {
    name: 'gemini',
    async *streamChat(input: ProviderChatInput): AsyncIterable<string> {
      const { systemInstruction, contents } = toGeminiPayload(input.messages);

      const url = `${GEMINI_BASE}/models/${encodeURIComponent(input.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(config.apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: systemInstruction
            ? { role: 'system', parts: [{ text: systemInstruction }] }
            : undefined,
          generationConfig: {
            maxOutputTokens: input.maxTokens,
            temperature: input.temperature,
          },
        }),
        signal: input.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        throw new Error(
          `Gemini stream failed (${res.status} ${res.statusText}): ${text.slice(0, 500)}`,
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
  const dataLines: string[] = [];
  for (const line of frame.split('\n')) {
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
  }
  if (dataLines.length === 0) return '';
  try {
    const obj = JSON.parse(dataLines.join('\n')) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const parts = obj.candidates?.[0]?.content?.parts ?? [];
    return parts.map((p) => p.text ?? '').join('');
  } catch {
    return '';
  }
}

/**
 * Gemini wants:
 *   - `systemInstruction` separately (not in `contents`),
 *   - and `assistant` role renamed to `model`.
 */
function toGeminiPayload(messages: ChatMessage[]): {
  systemInstruction: string;
  contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
} {
  const systems: string[] = [];
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  for (const m of messages) {
    if (m.role === 'system') {
      systems.push(m.content);
      continue;
    }
    contents.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    });
  }
  return { systemInstruction: systems.join('\n\n'), contents };
}
