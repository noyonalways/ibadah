/**
 * AI Configuration API Client
 * 
 * Admin-only API calls for managing AI providers, settings, and monitoring usage.
 */

import { authStorage } from './auth-storage';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

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

// API Functions

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = authStorage.getAccess();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

/**
 * Get all configured AI providers with full settings (model, tokens, tier,
 * masked key, etc.). Uses the detailed `/provider` endpoint — the plural
 * `/providers` endpoint only returns a trimmed shape and leaves the form blank.
 */
export async function getProviders(): Promise<ProviderConfig[]> {
  const res = await fetch(`${API_BASE}/ai/config/provider`, {
    headers: await getAuthHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to fetch providers' }));
    throw new Error(error.message);
  }

  const data = await res.json();
  return data.data;
}

/**
 * Reveal a provider's full stored API key (admin only).
 */
export async function getProviderKey(provider: string): Promise<string> {
  const res = await fetch(`${API_BASE}/ai/config/provider/${provider}/key`, {
    headers: await getAuthHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to reveal API key' }));
    throw new Error(error.message);
  }

  const data = await res.json();
  return data.data?.apiKey ?? '';
}

/**
 * Get current AI settings
 */
export async function getAISettings(): Promise<AISettings> {
  const res = await fetch(`${API_BASE}/ai/config`, {
    headers: await getAuthHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to fetch settings' }));
    throw new Error(error.message);
  }

  const data = await res.json();
  return data.data;
}

/**
 * Update provider configuration
 */
export async function updateProvider(
  provider: string,
  config: Partial<ProviderConfig>
): Promise<ProviderConfig> {
  const res = await fetch(`${API_BASE}/ai/config/provider`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ name: provider, ...config }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to update provider' }));
    throw new Error(error.message);
  }

  const data = await res.json();
  return data.data;
}

/**
 * Test provider connection
 */
export async function testProvider(
  provider: string,
  apiKey: string,
  model?: string
): Promise<TestResult> {
  const res = await fetch(`${API_BASE}/ai/config/test`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ provider, apiKey, model }),
  });

  const data = await res.json();
  
  if (!res.ok && !data.success) {
    return {
      success: false,
      message: data.message || 'Test failed',
    };
  }

  return data;
}

/**
 * Update general AI settings
 */
export async function updateAISettings(settings: Partial<AISettings>): Promise<AISettings> {
  const res = await fetch(`${API_BASE}/ai/config`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(settings),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to update settings' }));
    throw new Error(error.message);
  }

  const data = await res.json();
  return data.data;
}

/**
 * Get usage statistics
 */
export async function getUsageStats(days: number = 30): Promise<UsageStats> {
  const res = await fetch(`${API_BASE}/ai/config/usage?days=${days}`, {
    headers: await getAuthHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to fetch usage stats' }));
    throw new Error(error.message);
  }

  const data = await res.json();
  return data.data;
}
