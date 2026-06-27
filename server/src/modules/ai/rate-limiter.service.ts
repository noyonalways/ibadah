/**
 * AI Rate Limiter Service
 * 
 * Implements rate limiting for AI API usage, with support for
 * different tiers (free, standard, premium) and per-provider limits.
 */

import type { ProviderName } from '@/modules/ai/ai.types';

export interface RateLimitState {
  requests: {
    minute: number;
    hour: number;
    day: number;
  };
  tokens: {
    minute: number;
    day: number;
  };
  lastReset: {
    minute: number;
    hour: number;
    day: number;
  };
  concurrentRequests: number;
}

export interface RateLimitCheck {
  allowed: boolean;
  retryAfter?: number;
  remaining: {
    requests: number;
    tokens: number;
  };
  limit: {
    requests: number;
    tokens: number;
  };
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  tokensPerMinute: number;
  tokensPerDay: number;
  concurrentRequests: number;
  retryAfterSeconds: number;
}

// Default rate limit configurations
const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  free: {
    requestsPerMinute: 20,
    requestsPerHour: 200,
    requestsPerDay: 2000,
    tokensPerMinute: 10000,
    tokensPerDay: 100000,
    concurrentRequests: 3,
    retryAfterSeconds: 60,
  },
  standard: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    tokensPerMinute: 50000,
    tokensPerDay: 500000,
    concurrentRequests: 5,
    retryAfterSeconds: 30,
  },
  premium: {
    requestsPerMinute: 200,
    requestsPerHour: 5000,
    requestsPerDay: 50000,
    tokensPerMinute: 200000,
    tokensPerDay: 2000000,
    concurrentRequests: 10,
    retryAfterSeconds: 15,
  },
};

// Per-provider rate limit overrides
const PROVIDER_LIMITS: Partial<Record<ProviderName, Partial<RateLimitConfig>>> = {
  openrouter: {
    requestsPerMinute: 20,
    requestsPerDay: 2000,
  },
  gemini: {
    requestsPerMinute: 60,
    requestsPerDay: 10000,
  },
};

class RateLimiterService {
  private state: Map<string, RateLimitState> = new Map();

  constructor() {
    // Periodic cleanup of old entries
    setInterval(() => this.cleanup(), 60 * 1000); // Every minute
  }

  /**
   * Check if a request is allowed under rate limits
   */
  async checkRateLimit(
    key: string,
    provider: ProviderName,
    tier: 'free' | 'standard' | 'premium' = 'free',
    estimatedTokens: number = 0
  ): Promise<RateLimitCheck> {
    const config = this.getRateLimitConfig(provider, tier);
    const state = this.getState(key);
    const now = Date.now();

    // Reset counters if needed
    this.resetCountersIfNeeded(state, now);

    // Check limits
    const requestsRemaining = Math.min(
      config.requestsPerMinute - state.requests.minute,
      config.requestsPerHour - state.requests.hour,
      config.requestsPerDay - state.requests.day
    );

    const tokensRemaining = Math.min(
      config.tokensPerMinute - state.tokens.minute,
      config.tokensPerDay - state.tokens.day
    );

    const allowed = 
      requestsRemaining > 0 &&
      tokensRemaining >= estimatedTokens &&
      state.concurrentRequests < config.concurrentRequests;

    let retryAfter: number | undefined;
    if (!allowed) {
      // Calculate when the next slot will be available
      if (state.requests.minute >= config.requestsPerMinute) {
        retryAfter = 60 - Math.floor((now - state.lastReset.minute) / 1000);
      } else if (state.concurrentRequests >= config.concurrentRequests) {
        retryAfter = config.retryAfterSeconds;
      } else {
        retryAfter = config.retryAfterSeconds;
      }
    }

    return {
      allowed,
      retryAfter: retryAfter && retryAfter > 0 ? retryAfter : undefined,
      remaining: {
        requests: Math.max(0, requestsRemaining),
        tokens: Math.max(0, tokensRemaining),
      },
      limit: {
        requests: config.requestsPerDay,
        tokens: config.tokensPerDay,
      },
    };
  }

  /**
   * Increment counters after a successful request
   */
  async incrementCounters(
    key: string,
    tokens: { input: number; output: number }
  ): Promise<void> {
    const state = this.getState(key);
    const now = Date.now();

    this.resetCountersIfNeeded(state, now);

    state.requests.minute++;
    state.requests.hour++;
    state.requests.day++;
    state.tokens.minute += tokens.input + tokens.output;
    state.tokens.day += tokens.input + tokens.output;
    state.concurrentRequests = Math.max(0, state.concurrentRequests - 1);

    this.saveState(key, state);
  }

  /**
   * Increment concurrent request count
   */
  async startRequest(key: string): Promise<void> {
    const state = this.getState(key);
    state.concurrentRequests++;
    this.saveState(key, state);
  }

  /**
   * Decrement concurrent request count
   */
  async endRequest(key: string): Promise<void> {
    const state = this.getState(key);
    state.concurrentRequests = Math.max(0, state.concurrentRequests - 1);
    this.saveState(key, state);
  }

  /**
   * Get rate limit configuration for a provider and tier
   */
  private getRateLimitConfig(
    provider: ProviderName,
    tier: 'free' | 'standard' | 'premium'
  ): RateLimitConfig {
    const baseConfig = DEFAULT_LIMITS[tier];
    const providerOverride = PROVIDER_LIMITS[provider];

    return {
      ...baseConfig,
      ...providerOverride,
    };
  }

  /**
   * Get current rate limit state for a key
   */
  private getState(key: string): RateLimitState {
    // In production, this would use Redis or a distributed cache
    // For now, use an in-memory map
    const state = this.state.get(key);
    if (state) {
      return state;
    }

    const now = Date.now();
    const newState: RateLimitState = {
      requests: { minute: 0, hour: 0, day: 0 },
      tokens: { minute: 0, day: 0 },
      lastReset: { minute: now, hour: now, day: now },
      concurrentRequests: 0,
    };

    this.state.set(key, newState);
    return newState;
  }

  /**
   * Save rate limit state
   */
  private saveState(key: string, state: RateLimitState): void {
    this.state.set(key, state);
  }

  /**
   * Reset counters if time windows have passed
   */
  private resetCountersIfNeeded(state: RateLimitState, now: number): void {
    const minuteMs = 60 * 1000;
    const hourMs = 60 * minuteMs;
    const dayMs = 24 * hourMs;

    if (now - state.lastReset.minute >= minuteMs) {
      state.requests.minute = 0;
      state.tokens.minute = 0;
      state.lastReset.minute = now;
    }

    if (now - state.lastReset.hour >= hourMs) {
      state.requests.hour = 0;
      state.lastReset.hour = now;
    }

    if (now - state.lastReset.day >= dayMs) {
      state.requests.day = 0;
      state.tokens.day = 0;
      state.lastReset.day = now;
    }
  }

  /**
   * Clean up old rate limit entries
   */
  private cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [key, state] of this.state.entries()) {
      if (now - state.lastReset.day > maxAge) {
        this.state.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiterService();
