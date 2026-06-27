/**
 * Anthropic (Claude) provider implementation
 */
import Anthropic from '@anthropic-ai/sdk';
import type { AiProvider, StreamChatOptions } from '@/modules/ai/ai.types';

export class AnthropicProvider implements AiProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async *streamChat(options: StreamChatOptions): AsyncIterable<string> {
    // Anthropic requires system messages to be separate
    const systemMessage = options.messages.find((m) => m.role === 'system');
    const nonSystemMessages = options.messages.filter((m) => m.role !== 'system');

    const stream = await this.client.messages.stream({
      model: options.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      system: systemMessage?.content || '',
      messages: nonSystemMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        yield chunk.delta.text;
      }
    }
  }
}
