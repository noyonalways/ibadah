/**
 * Anthropic (Claude) provider implementation with native tool calling.
 */
import Anthropic from '@anthropic-ai/sdk';
import type {
  MessageParam,
  Tool,
  ContentBlockParam,
} from '@anthropic-ai/sdk/resources/messages';

import type {
  AiProvider,
  ChatMessage,
  CompletionChunk,
  StreamChatOptions,
  StreamCompletionOptions,
  ToolSpec,
} from '@/modules/ai/ai.types';

/**
 * Translate our internal messages into Anthropic's format. Anthropic
 * keeps the system prompt separate and expects tool results to be
 * `tool_result` blocks inside a `user` turn, so consecutive tool
 * messages are merged into a single user message.
 */
function toAnthropicMessages(messages: ChatMessage[]): {
  system: string;
  messages: MessageParam[];
} {
  const systemParts: string[] = [];
  const out: MessageParam[] = [];

  for (const m of messages) {
    if (m.role === 'system') {
      systemParts.push(m.content);
      continue;
    }

    if (m.role === 'tool') {
      const block: ContentBlockParam = {
        type: 'tool_result',
        tool_use_id: m.toolCallId ?? '',
        content: m.content,
      };
      const last = out[out.length - 1];
      if (last && last.role === 'user' && Array.isArray(last.content)) {
        (last.content as ContentBlockParam[]).push(block);
      } else {
        out.push({ role: 'user', content: [block] });
      }
      continue;
    }

    if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
      const blocks: ContentBlockParam[] = [];
      if (m.content && m.content.trim()) {
        blocks.push({ type: 'text', text: m.content });
      }
      for (const tc of m.toolCalls) {
        blocks.push({
          type: 'tool_use',
          id: tc.id,
          name: tc.name,
          input: tc.arguments ?? {},
        });
      }
      out.push({ role: 'assistant', content: blocks });
      continue;
    }

    out.push({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    });
  }

  return { system: systemParts.join('\n\n'), messages: out };
}

function toAnthropicTools(tools: ToolSpec[] | undefined): Tool[] | undefined {
  if (!tools || tools.length === 0) return undefined;
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters as Tool.InputSchema,
  }));
}

interface PartialToolBlock {
  id: string;
  name: string;
  json: string;
}

export class AnthropicProvider implements AiProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async *streamCompletion(options: StreamCompletionOptions): AsyncIterable<CompletionChunk> {
    const { system, messages } = toAnthropicMessages(options.messages);
    const tools = toAnthropicTools(options.tools);

    const stream = this.client.messages.stream({
      model: options.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      system,
      messages,
      ...(tools ? { tools } : {}),
    });

    const blocks = new Map<number, PartialToolBlock>();

    for await (const event of stream) {
      if (options.signal?.aborted) break;

      if (event.type === 'content_block_start') {
        if (event.content_block.type === 'tool_use') {
          blocks.set(event.index, {
            id: event.content_block.id,
            name: event.content_block.name,
            json: '',
          });
        }
      } else if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          yield { type: 'text', delta: event.delta.text };
        } else if (event.delta.type === 'input_json_delta') {
          const block = blocks.get(event.index);
          if (block) block.json += event.delta.partial_json;
        }
      }
    }

    for (const block of blocks.values()) {
      yield {
        type: 'tool_call',
        toolCall: {
          id: block.id,
          name: block.name,
          arguments: safeParseArgs(block.json),
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
