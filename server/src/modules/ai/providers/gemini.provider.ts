/**
 * Google Gemini provider implementation with native function calling.
 */
import {
  GoogleGenerativeAI,
  type Content,
  type Part,
  type Tool,
  type FunctionDeclaration,
  type FunctionDeclarationSchema,
} from '@google/generative-ai';

import type {
  AiProvider,
  ChatMessage,
  CompletionChunk,
  StreamChatOptions,
  StreamCompletionOptions,
  ToolSpec,
} from '@/modules/ai/ai.types';

/**
 * Translate internal messages into Gemini `Content[]`. Gemini keeps the
 * system prompt separate, uses `model` for assistant turns, and expects
 * tool results as `functionResponse` parts in a `function` role turn.
 */
function toGeminiContents(messages: ChatMessage[]): {
  systemInstruction?: string;
  contents: Content[];
} {
  const systemParts: string[] = [];
  const contents: Content[] = [];

  for (const m of messages) {
    if (m.role === 'system') {
      systemParts.push(m.content);
      continue;
    }

    if (m.role === 'tool') {
      const part: Part = {
        functionResponse: {
          name: m.name ?? 'tool',
          response: { result: safeParse(m.content) },
        },
      };
      const last = contents[contents.length - 1];
      if (last && last.role === 'function') {
        last.parts.push(part);
      } else {
        contents.push({ role: 'function', parts: [part] });
      }
      continue;
    }

    if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
      const parts: Part[] = [];
      if (m.content && m.content.trim()) parts.push({ text: m.content });
      for (const tc of m.toolCalls) {
        parts.push({ functionCall: { name: tc.name, args: tc.arguments ?? {} } });
      }
      contents.push({ role: 'model', parts });
      continue;
    }

    contents.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    });
  }

  return {
    systemInstruction: systemParts.length > 0 ? systemParts.join('\n\n') : undefined,
    contents,
  };
}

function toGeminiTools(tools: ToolSpec[] | undefined): Tool[] | undefined {
  if (!tools || tools.length === 0) return undefined;
  const functionDeclarations: FunctionDeclaration[] = tools.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters as unknown as FunctionDeclarationSchema,
  }));
  return [{ functionDeclarations }];
}

export class GeminiProvider implements AiProvider {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async *streamCompletion(options: StreamCompletionOptions): AsyncIterable<CompletionChunk> {
    const { systemInstruction, contents } = toGeminiContents(options.messages);
    const tools = toGeminiTools(options.tools);

    const model = this.client.getGenerativeModel({
      model: options.model,
      ...(systemInstruction ? { systemInstruction } : {}),
      ...(tools ? { tools } : {}),
    });

    const result = await model.generateContentStream({
      contents,
      generationConfig: {
        maxOutputTokens: options.maxTokens,
        temperature: options.temperature,
      },
    });

    for await (const chunk of result.stream) {
      if (options.signal?.aborted) break;

      const text = chunk.text();
      if (text) yield { type: 'text', delta: text };

      const calls = chunk.functionCalls();
      if (calls) {
        for (const call of calls) {
          yield {
            type: 'tool_call',
            toolCall: {
              id: `call_${call.name}_${Math.random().toString(36).slice(2, 8)}`,
              name: call.name,
              arguments: (call.args ?? {}) as Record<string, unknown>,
            },
          };
        }
      }
    }
  }

  async *streamChat(options: StreamChatOptions): AsyncIterable<string> {
    for await (const chunk of this.streamCompletion(options)) {
      if (chunk.type === 'text') yield chunk.delta;
    }
  }
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}
