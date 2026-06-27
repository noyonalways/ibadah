/**
 * Shared base for OpenAI-compatible providers (OpenAI + OpenRouter).
 *
 * Both speak the OpenAI Chat Completions wire format, including native
 * function/tool calling, so the message translation and streaming
 * tool-call accumulation live here once.
 */
import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';

import type {
  AiProvider,
  ChatMessage,
  CompletionChunk,
  StreamChatOptions,
  StreamCompletionOptions,
  ToolSpec,
} from '@/modules/ai/ai.types';

/** Map our internal message shape onto the OpenAI Chat Completions shape. */
function toOpenAiMessages(messages: ChatMessage[]): ChatCompletionMessageParam[] {
  return messages.map((m): ChatCompletionMessageParam => {
    if (m.role === 'tool') {
      return {
        role: 'tool',
        tool_call_id: m.toolCallId ?? '',
        content: m.content,
      };
    }
    if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
      return {
        role: 'assistant',
        content: m.content || null,
        tool_calls: m.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments ?? {}),
          },
        })),
      };
    }
    if (m.role === 'system') {
      return { role: 'system', content: m.content };
    }
    if (m.role === 'assistant') {
      return { role: 'assistant', content: m.content };
    }
    return { role: 'user', content: m.content };
  });
}

function toOpenAiTools(tools: ToolSpec[] | undefined): ChatCompletionTool[] | undefined {
  if (!tools || tools.length === 0) return undefined;
  return tools.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters as Record<string, unknown>,
    },
  }));
}

interface PartialToolCall {
  id: string;
  name: string;
  args: string;
}

export abstract class OpenAiCompatibleProvider implements AiProvider {
  protected abstract get client(): OpenAI;

  /** Extra per-request headers (OpenRouter attribution, etc.). */
  protected requestHeaders(): Record<string, string> {
    return {};
  }

  async *streamCompletion(options: StreamCompletionOptions): AsyncIterable<CompletionChunk> {
    const tools = toOpenAiTools(options.tools);

    const stream = await this.client.chat.completions.create(
      {
        model: options.model,
        messages: toOpenAiMessages(options.messages),
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        stream: true,
        ...(tools ? { tools, tool_choice: 'auto' } : {}),
      },
      { headers: this.requestHeaders(), signal: options.signal },
    );

    // Tool-call fragments arrive split across deltas, keyed by index.
    const partials = new Map<number, PartialToolCall>();

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      const delta = choice.delta;
      if (delta?.content) {
        yield { type: 'text', delta: delta.content };
      }

      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          const existing = partials.get(idx) ?? { id: '', name: '', args: '' };
          if (tc.id) existing.id = tc.id;
          if (tc.function?.name) existing.name = tc.function.name;
          if (tc.function?.arguments) existing.args += tc.function.arguments;
          partials.set(idx, existing);
        }
      }
    }

    // Flush completed tool calls once the stream ends.
    for (const partial of partials.values()) {
      if (!partial.name) continue;
      yield {
        type: 'tool_call',
        toolCall: {
          id: partial.id || `call_${partial.name}_${Math.random().toString(36).slice(2, 8)}`,
          name: partial.name,
          arguments: safeParseArgs(partial.args),
        },
      };
    }
  }

  async *streamChat(options: StreamChatOptions): AsyncIterable<string> {
    for await (const chunk of this.streamCompletion(options)) {
      if (chunk.type === 'text') yield chunk.delta;
    }
  }
}

function safeParseArgs(raw: string): Record<string, unknown> {
  if (!raw || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
