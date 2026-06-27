/**
 * AI configuration management
 * 
 * This module now uses database-backed configuration via ai-config.service.
 * Environment variables are used as fallback defaults only.
 * 
 * All AI settings are stored in the ai_config collection and managed
 * through the admin UI at /ai-settings.
 */

import type { ProviderName, AiConfig } from '@/modules/ai/ai.types';
import { aiConfigService } from '@/modules/ai/ai-config.service';

const DEFAULT_MODELS: Record<ProviderName, string> = {
  openrouter: 'openai/gpt-4o-mini',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-latest',
  gemini: 'gemini-1.5-flash',
};

const PROVIDER_KEY_ENV: Record<ProviderName, string> = {
  openrouter: 'OPENROUTER_API_KEY',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  gemini: 'GEMINI_API_KEY',
};

const ALL_PROVIDERS: readonly ProviderName[] = [
  'openrouter',
  'openai',
  'anthropic',
  'gemini',
];

export class AiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiConfigError';
  }
}

function parseProvider(raw: string | undefined): ProviderName {
  if (!raw) return 'openrouter';
  const lower = raw.toLowerCase();
  if ((ALL_PROVIDERS as readonly string[]).includes(lower)) {
    return lower as ProviderName;
  }
  throw new AiConfigError(
    `Unknown AI_PROVIDER "${raw}". Expected one of: ${ALL_PROVIDERS.join(', ')}.`,
  );
}

function parseNumber(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Get AI configuration from database with environment fallback
 * 
 * This function first attempts to load configuration from the database.
 * If the database is unavailable or not configured, it falls back to
 * environment variables.
 * 
 * All AI operations should use this function to ensure consistent
 * configuration across the application.
 */
export async function getAiConfig(): Promise<AiConfig> {
  try {
    // Try to get config from database
    const dbConfig = await aiConfigService.getConfig();
    const activeProvider = dbConfig.activeProvider;
    
    // Get the provider configuration with API key
    const providerConfig = await aiConfigService.getProviderWithKey(activeProvider);
    
    if (!providerConfig || !providerConfig.apiKey) {
      throw new AiConfigError(
        `No API key configured for provider "${activeProvider}". Please configure it in the admin settings.`
      );
    }

    return {
      provider: activeProvider,
      model: dbConfig.defaultModel,
      apiKey: providerConfig.apiKey,
      maxTokens: dbConfig.maxTokens,
      temperature: dbConfig.temperature,
      siteUrl: dbConfig.siteUrl,
      siteName: dbConfig.siteName,
    };
  } catch (error) {
    // Log the error but don't expose it to clients
    console.warn('Failed to load AI config from database, falling back to environment:', error);
    
    // Fall back to environment variables
    return getAiConfigFromEnv();
  }
}

/**
 * Get AI configuration from environment variables (fallback)
 */
function getAiConfigFromEnv(): AiConfig {
  const provider = parseProvider(process.env.AI_PROVIDER);
  const model = process.env.AI_MODEL?.trim() || DEFAULT_MODELS[provider];

  const providerKey = process.env[PROVIDER_KEY_ENV[provider]]?.trim();
  const genericKey = process.env.AI_API_KEY?.trim();
  const apiKey = providerKey || genericKey;

  if (!apiKey) {
    throw new AiConfigError(
      `Missing API key for provider "${provider}". Set ${PROVIDER_KEY_ENV[provider]} or AI_API_KEY in your environment, or configure it in the admin settings.`,
    );
  }

  return {
    provider,
    model,
    apiKey,
    maxTokens: parseNumber(process.env.AI_MAX_TOKENS, 1024),
    temperature: parseNumber(process.env.AI_TEMPERATURE, 0.4),
    siteUrl: process.env.AI_SITE_URL?.trim() || undefined,
    siteName: process.env.AI_SITE_NAME?.trim() || 'Ibadah',
  };
}

// Re-export the service for direct access
export { aiConfigService };
