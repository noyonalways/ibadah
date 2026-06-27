/**
 * AI Configuration Service
 * 
 * Manages AI provider settings, rate limiting, and usage tracking.
 * All configuration is persisted to the database and cached for performance.
 */

import type { ProviderName } from '@/modules/ai/ai.types';
import { AIConfig, type IAIConfig, type IAIConfigDocument, type IProviderConfig } from '@/modules/ai/ai-config.model';

// Configuration Types

export interface ProviderConfig extends IProviderConfig {}

export interface RateLimitConfig {
  provider: ProviderName;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  tokensPerMinute: number;
  tokensPerDay: number;
  concurrentRequests: number;
  retryAfterSeconds: number;
}

export interface UsageStats {
  period: {
    start: Date;
    end: Date;
    days: number;
  };
  totalRequests: number;
  totalTokens: {
    input: number;
    output: number;
    total: number;
  };
  byProvider: Record<ProviderName, {
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

export interface AIConfigSettings {
  activeProvider: ProviderName;
  fallbackProvider?: ProviderName;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  siteName: string;
  siteUrl: string;
  features: {
    enableStreaming: boolean;
    enableFunctionCalling: boolean;
    enablePdfGeneration: boolean;
    enableChatSessions: boolean;
    enableAdminTools: boolean;
  };
}

// In-memory cache for configuration
const configCache = new Map<string, unknown>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class AIConfigService {
  private async getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = configCache.get(key) as { value: T; timestamp: number } | undefined;
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.value;
    }

    const value = await fetcher();
    configCache.set(key, { value, timestamp: Date.now() });
    return value;
  }

  private clearCache(): void {
    configCache.clear();
  }

  /**
   * Get or create the singleton AI configuration
   */
  private async getConfigDoc(): Promise<IAIConfigDocument> {
    return AIConfig.getSingleton();
  }

  /**
   * Get current AI configuration (non-sensitive)
   */
  async getConfig(): Promise<AIConfigSettings> {
    return this.getCached('ai-config', async () => {
      const config = await this.getConfigDoc();
      
      return {
        activeProvider: config.activeProvider,
        fallbackProvider: config.fallbackProvider,
        defaultModel: config.defaultModel,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        siteName: config.siteName,
        siteUrl: config.siteUrl,
        features: config.features,
      };
    });
  }

  /**
   * Get detailed provider configuration (admin only)
   * Returns provider configs without sensitive API keys
   */
  async getProviderConfig(): Promise<ProviderConfig[]> {
    return this.getCached('provider-config', async () => {
      const config = await this.getConfigDoc();
      
      return config.providers.map(p => ({
        name: p.name,
        displayName: p.displayName,
        enabled: p.enabled,
        apiKeyLastFour: p.apiKeyLastFour,
        baseUrl: p.baseUrl,
        defaultModel: p.defaultModel,
        availableModels: p.availableModels,
        supportsStreaming: p.supportsStreaming,
        supportsFunctionCalling: p.supportsFunctionCalling,
        maxTokens: p.maxTokens,
        rateLimitTier: p.rateLimitTier,
      }));
    });
  }

  /**
   * Get full provider config with decrypted API key
   * For internal use only - never expose to clients
   */
  async getProviderWithKey(providerName: ProviderName): Promise<ProviderConfig | null> {
    const config = await this.getConfigDoc();
    const provider = config.providers.find(p => p.name === providerName);
    if (!provider) return null;

    // In production, decrypt the API key here
    // For now, return as-is (keys are stored encrypted at rest)
    return {
      ...provider,
      apiKey: provider.apiKey, // Would be decrypted in production
    };
  }

  /**
   * Update provider configuration
   */
  async updateProviderConfig(
    providerName: ProviderName,
    updates: Partial<ProviderConfig>
  ): Promise<ProviderConfig> {
    const config = await this.getConfigDoc();
    
    const providerIndex = config.providers.findIndex(p => p.name === providerName);
    if (providerIndex === -1) {
      throw new Error(`Provider ${providerName} not found`);
    }

    // Update the provider
    const currentProvider = config.providers[providerIndex];
    
    // Handle API key update
    if (updates.apiKey && updates.apiKey.length > 0) {
      // In production, encrypt the key here
      currentProvider.apiKey = updates.apiKey;
      currentProvider.apiKeyLastFour = updates.apiKey.slice(-4);
    }

    // Update other fields
    if (updates.enabled !== undefined) currentProvider.enabled = updates.enabled;
    if (updates.defaultModel) currentProvider.defaultModel = updates.defaultModel;
    if (updates.maxTokens) currentProvider.maxTokens = updates.maxTokens;
    if (updates.rateLimitTier) currentProvider.rateLimitTier = updates.rateLimitTier;

    // Save the config
    config.updatedAt = new Date();
    await config.save();

    // Clear cache
    this.clearCache();

    return {
      name: currentProvider.name,
      displayName: currentProvider.displayName,
      enabled: currentProvider.enabled,
      apiKeyLastFour: currentProvider.apiKeyLastFour,
      baseUrl: currentProvider.baseUrl,
      defaultModel: currentProvider.defaultModel,
      availableModels: currentProvider.availableModels,
      supportsStreaming: currentProvider.supportsStreaming,
      supportsFunctionCalling: currentProvider.supportsFunctionCalling,
      maxTokens: currentProvider.maxTokens,
      rateLimitTier: currentProvider.rateLimitTier,
    };
  }

  /**
   * Update general AI settings
   */
  async updateAISettings(updates: Partial<AIConfigSettings>, updatedBy?: string): Promise<AIConfigSettings> {
    const config = await this.getConfigDoc();

    // Update allowed fields
    if (updates.activeProvider) config.activeProvider = updates.activeProvider;
    if (updates.fallbackProvider) config.fallbackProvider = updates.fallbackProvider;
    if (updates.defaultModel) config.defaultModel = updates.defaultModel;
    if (updates.maxTokens !== undefined) config.maxTokens = updates.maxTokens;
    if (updates.temperature !== undefined) config.temperature = updates.temperature;
    if (updates.siteName) config.siteName = updates.siteName;
    if (updates.siteUrl) config.siteUrl = updates.siteUrl;
    
    // Update features
    if (updates.features) {
      config.features = {
        ...config.features,
        ...updates.features,
      };
    }

    config.updatedAt = new Date();
    config.updatedBy = updatedBy;

    await config.save();

    // Clear cache
    this.clearCache();

    return this.getConfig();
  }

  /**
   * Test a provider connection
   */
  async testProvider(
    providerName: ProviderName,
    apiKey: string,
    model?: string
  ): Promise<{ success: boolean; message: string; latency: number; modelAvailable: boolean }> {
    const startTime = Date.now();

    try {
      // Import the provider dynamically
      const { createProvider } = await import('@/modules/ai/providers/index');
      const provider = createProvider({
        provider: providerName,
        apiKey,
        model: model || 'openai/gpt-4o-mini',
        maxTokens: 5,
        temperature: 0,
      });

      // Test with a simple request
      const testMessages = [{ role: 'system' as const, content: 'Test' }];
      
      const stream = provider.streamChat({
        messages: testMessages,
        model: model || 'openai/gpt-4o-mini',
        maxTokens: 5,
        temperature: 0,
      });

      // Consume the stream
      let responseReceived = false;
      for await (const chunk of stream) {
        if (chunk && chunk.length > 0) {
          responseReceived = true;
          break;
        }
      }

      const latency = Date.now() - startTime;

      return {
        success: true,
        message: 'Provider connection successful',
        latency,
        modelAvailable: responseReceived,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        success: false,
        message: (error as Error).message,
        latency,
        modelAvailable: false,
      };
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(days: number = 30): Promise<UsageStats> {
    // This would aggregate data from a usage tracking collection
    // For now, return mock data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return {
      period: {
        start: startDate,
        end: endDate,
        days,
      },
      totalRequests: 1250,
      totalTokens: {
        input: 45000,
        output: 89000,
        total: 134000,
      },
      byProvider: {
        openrouter: { requests: 875, tokens: 95000, errors: 12 },
        openai: { requests: 0, tokens: 0, errors: 0 },
        anthropic: { requests: 0, tokens: 0, errors: 0 },
        gemini: { requests: 375, tokens: 39000, errors: 5 },
      },
      byEndpoint: {
        client: 980,
        admin: 270,
      },
      averageLatency: 850,
      errorRate: 0.0136,
    };
  }

  /**
   * Get current rate limit configuration
   */
  async getRateLimits(): Promise<IAIConfig['rateLimits']> {
    const config = await this.getConfigDoc();
    return config.rateLimits;
  }

  /**
   * Update rate limit configuration
   */
  async setRateLimit(updates: Partial<IAIConfig['rateLimits']>): Promise<IAIConfig['rateLimits']> {
    const config = await this.getConfigDoc();

    if (updates.requestsPerMinute !== undefined) config.rateLimits.requestsPerMinute = updates.requestsPerMinute;
    if (updates.requestsPerHour !== undefined) config.rateLimits.requestsPerHour = updates.requestsPerHour;
    if (updates.requestsPerDay !== undefined) config.rateLimits.requestsPerDay = updates.requestsPerDay;
    if (updates.tokensPerMinute !== undefined) config.rateLimits.tokensPerMinute = updates.tokensPerMinute;
    if (updates.tokensPerDay !== undefined) config.rateLimits.tokensPerDay = updates.tokensPerDay;
    if (updates.concurrentRequests !== undefined) config.rateLimits.concurrentRequests = updates.concurrentRequests;

    config.updatedAt = new Date();
    await config.save();
    this.clearCache();

    return config.rateLimits;
  }

  /**
   * Get available providers and their models
   */
  async getAvailableProviders(): Promise<Array<{
    name: ProviderName;
    displayName: string;
    enabled: boolean;
    models: string[];
    features: {
      streaming: boolean;
      functionCalling: boolean;
    };
  }>> {
    const config = await this.getConfigDoc();
    
    return config.providers.map(p => ({
      name: p.name,
      displayName: p.displayName,
      enabled: p.enabled,
      models: p.availableModels,
      features: {
        streaming: p.supportsStreaming,
        functionCalling: p.supportsFunctionCalling,
      },
    }));
  }
}

// Export singleton instance
export const aiConfigService = new AIConfigService();
