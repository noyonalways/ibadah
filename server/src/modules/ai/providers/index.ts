/**
 * Provider factory
 */
import type { AiConfig, AiProvider } from '../ai.types.js';
import { OpenAiProvider } from './openai.provider.js';
import { AnthropicProvider } from './anthropic.provider.js';
import { GeminiProvider } from './gemini.provider.js';
import { OpenRouterProvider } from './openrouter.provider.js';

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
