/**
 * OpenAI provider — same wire format as OpenRouter, just a different
 * base URL and no extra ranking headers. Useful as a fallback for
 * deployments that already have an OpenAI key.
 */
import type { AiConfig } from '../config';
import type { ChatProvider, ProviderChatInput } from '../types';
import { streamOpenAiCompatible, toOpenAiMessages } from './openai-compatible';

const OPENAI_BASE = 'https://api.openai.com/v1';

export function createOpenAiProvider(config: AiConfig): ChatProvider {
  return {
    name: 'openai',
    async *streamChat(input: ProviderChatInput): AsyncIterable<string> {
      yield* streamOpenAiCompatible({
        url: `${OPENAI_BASE}/chat/completions`,
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: {
          model: input.model,
          messages: toOpenAiMessages(input.messages),
          stream: true,
          max_tokens: input.maxTokens,
          temperature: input.temperature,
        },
        signal: input.signal,
      });
    },
  };
}
