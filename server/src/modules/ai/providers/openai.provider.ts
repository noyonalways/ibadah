/**
 * OpenAI provider implementation
 */
import OpenAI from 'openai';
import type { AiProvider, StreamChatOptions } from '@/modules/ai/ai.types';

export class OpenAiProvider implements AiProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async *streamChat(options: StreamChatOptions): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: options.model,
      messages: options.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
  }
}
