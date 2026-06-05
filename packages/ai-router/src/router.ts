import Redis from 'ioredis';

export type TaskType =
  | "entity_extraction"
  | "fast_classification"
  | "trend_detection"
  | "general_reasoning"
  | "seo_generation"
  | "attention_processing"
  | "recommendation_generation";

export type Provider = "openrouter" | "gemini" | "chatgpt_tactical" | "grok" | "cache";

export interface RouteDecision {
  provider: Provider;
  fallback: Provider[];
}

export class AIRouter {
  private redis: Redis;
  private openrouterQuotaLimit = 50;

  constructor(redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379') {
    this.redis = new Redis(redisUrl);
  }

  async getQuotaUsed(): Promise<number> {
    const used = await this.redis.get('simis:ai:quota:openrouter');
    return used ? parseInt(used, 10) : 0;
  }

  async route(task: TaskType): Promise<RouteDecision> {
    switch (task) {
      case "entity_extraction":
      case "attention_processing":
      case "recommendation_generation":
        // Gemini is the Primary Core for OS Logic
        return {
          provider: "gemini",
          fallback: ["chatgpt_tactical", "openrouter", "cache"]
        };

      case "fast_classification":
      case "seo_generation":
        // Tactical Free Tier tasks
        return {
          provider: "chatgpt_tactical",
          fallback: ["gemini", "openrouter", "cache"]
        };

      case "trend_detection":
        // Signal Layer
        return {
          provider: "grok",
          fallback: ["gemini", "openrouter", "cache"]
        };

      case "general_reasoning":
      default:
        // Use OpenRouter for general tasks until quota is exhausted
        const used = await this.getQuotaUsed();
        if (used < this.openrouterQuotaLimit) {
          await this.incrementQuotaUsage();
          return {
            provider: "openrouter",
            fallback: ["gemini", "chatgpt_tactical", "grok", "cache"]
          };
        }

        // Fallback when quota exhausted
        return {
          provider: "gemini",
          fallback: ["chatgpt_tactical", "cache"]
        };
    }
  }

  /**
   * Atomically increments the OpenRouter quota usage in Redis.
   * Uses a daily expiry to reset the quota automatically.
   */
  async incrementQuotaUsage(amount: number = 1): Promise<void> {
    const key = 'simis:ai:quota:openrouter';
    // Atomic: only set expiry if key is new (NX)
    const set = await this.redis.set(key, amount, 'EX', 86400, 'NX');
    if (!set) {
      // Key already exists — just increment
      await this.redis.incrby(key, amount);
    }
  }

  async getQuotaStatus() {
    const used = await this.getQuotaUsed();
    return {
      used,
      limit: this.openrouterQuotaLimit,
      remaining: Math.max(0, this.openrouterQuotaLimit - used)
    };
  }
}
