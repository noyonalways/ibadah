/**
 * OpenRouter provider implementation (uses OpenAI-compatible API)
 */
import OpenAI from 'openai';
import type { AiProvider, StreamChatOptions } from '../ai.types.js';

export class OpenRouterProvider implements AiProvider {
  private client: OpenAI;
  private siteUrl?: string;
  private siteName?: string;

  constructor(apiKey: string, siteUrl?: string, siteName?: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });
    this.siteUrl = siteUrl;
    this.siteName = siteName;
  }

  async *streamChat(options: StreamChatOptions): AsyncIterable<string> {
    const headers: Record<string, string> = {};
    if (this.siteUrl) headers['HTTP-Referer'] = this.siteUrl;
    if (this.siteName) headers['X-Title'] = this.siteName;

    const stream = await this.client.chat.completions.create({
      model: options.model,
      messages: options.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      stream: true,
    }, {
      headers,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
  }
}
