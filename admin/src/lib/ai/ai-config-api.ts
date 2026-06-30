/**
 * AI Configuration API Client
 * 
 * Admin-only API calls for managing AI providers, settings, and monitoring usage.
 */

import { api, ApiClientError } from '../api';

export interface ProviderConfig {
  name: string;
  displayName: string;
  enabled: boolean;
  apiKey?: string;
  apiKeyLastFour?: string;
  baseUrl?: string;
  defaultModel: string;
  availableModels: string[];
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  maxTokens: number;
  rateLimitTier: 'free' | 'standard' | 'premium';
}

export interface AISettings {
  activeProvider: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  features: {
    enableStreaming: boolean;
    enableFunctionCalling: boolean;
    enablePdfGeneration: boolean;
    enableChatSessions: boolean;
    enableAdminTools: boolean;
  };
}

export interface UsageStats {
  period: {
    start: string;
    end: string;
    days: number;
  };
  totalRequests: number;
  totalTokens: {
    input: number;
    output: number;
    total: number;
  };
  byProvider: Record<string, {
    requests: number;
    tokens: number;
    errors: number;
  }>;
  byEndpoint: {
    client: number;
    admin: number;
  };
  averageLatency: number;
  errorRate: number;
}

export interface TestResult {
  success: boolean;
  message: string;
  data?: {
    latency: number;
    modelAvailable: boolean;
    provider: string;
  };
}

// API Functions — all routed through the shared axios instance via `api`.

/**
 * Get all configured AI providers with full settings (model, tokens, tier,
 * masked key, etc.). Uses the detailed `/provider` endpoint — the plural
 * `/providers` endpoint only returns a trimmed shape and leaves the form blank.
 */
export async function getProviders(): Promise<ProviderConfig[]> {
  return api<ProviderConfig[]>('/ai/config/provider');
}

/**
 * Reveal a provider's full stored API key (admin only).
 */
export async function getProviderKey(provider: string): Promise<string> {
  const data = await api<{ apiKey?: string }>(`/ai/config/provider/${provider}/key`);
  return data?.apiKey ?? '';
}

/**
 * Get current AI settings
 */
export async function getAISettings(): Promise<AISettings> {
  return api<AISettings>('/ai/config');
}

/**
 * Update provider configuration
 */
export async function updateProvider(
  provider: string,
  config: Partial<ProviderConfig>
): Promise<ProviderConfig> {
  return api<ProviderConfig>('/ai/config/provider', {
    method: 'PATCH',
    body: { name: provider, ...config },
  });
}

/**
 * Test provider connection. Unlike the other calls this never throws — a
 * failed test is a normal, displayable outcome — so it maps both success
 * and error into the `TestResult` shape.
 */
export async function testProvider(
  provider: string,
  apiKey: string,
  model?: string
): Promise<TestResult> {
  try {
    const raw = await api.raw<TestResult['data']>('/ai/config/test', {
      method: 'POST',
      body: { provider, apiKey, model },
    });
    return { success: true, message: raw.message, data: raw.data };
  } catch (err) {
    return {
      success: false,
      message: err instanceof ApiClientError ? err.message : 'Test failed',
    };
  }
}

/**
 * Update general AI settings
 */
export async function updateAISettings(settings: Partial<AISettings>): Promise<AISettings> {
  return api<AISettings>('/ai/config', { method: 'PATCH', body: settings });
}

/**
 * Get usage statistics
 */
export async function getUsageStats(days: number = 30): Promise<UsageStats> {
  return api<UsageStats>(`/ai/config/usage?days=${days}`);
}
