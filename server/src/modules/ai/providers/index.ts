/**
 * Provider factory
 */
import type { AiConfig, AiProvider } from '@/modules/ai/ai.types';
import { OpenAiProvider } from '@/modules/ai/providers/openai.provider';
import { AnthropicProvider } from '@/modules/ai/providers/anthropic.provider';
import { GeminiProvider } from '@/modules/ai/providers/gemini.provider';
import { OpenRouterProvider } from '@/modules/ai/providers/openrouter.provider';

export function createProvider(config: AiConfig): AiProvider {
  switch (config.provider) {
    case 'openai':
      return new OpenAiProvider(config.apiKey);
    case 'anthropic':
      return new AnthropicProvider(config.apiKey);
    case 'gemini':
      return new GeminiProvider(config.apiKey);
    case 'openrouter':
      return new OpenRouterProvider(config.apiKey, config.siteUrl, config.siteName);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}
