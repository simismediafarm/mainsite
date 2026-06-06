import Redis from 'ioredis';

export interface CostGovernorConfig {
  maxCostPerRequestUsd: number;
  maxSyncAiLatencyMs: number;
  maxFallbackDepth: number;
}

const DEFAULT_CONFIG: CostGovernorConfig = {
  maxCostPerRequestUsd: parseFloat(process.env.MAX_COST_PER_REQUEST_USD || '0.01'),
  maxSyncAiLatencyMs: parseInt(process.env.MAX_SYNC_AI_LATENCY_MS || '300', 10),
  maxFallbackDepth: parseInt(process.env.MAX_FALLBACK_DEPTH || '3', 10),
};

export class CostGovernor {
  private redis: Redis;
  private config: CostGovernorConfig;

  constructor(redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379', config: Partial<CostGovernorConfig> = {}) {
    this.redis = new Redis(redisUrl);
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Pre-flight check: Validates if the user/system has enough remaining budget.
   * Throws an error if hard limits are exceeded.
   */
  async assertBudgetAvailable(userId?: string): Promise<void> {
    if (!userId) return;

    const currentCost = await this.getCurrentCost(userId);
    if (currentCost >= this.config.maxCostPerRequestUsd) {
      throw new Error(`COST_GOVERNOR_VIOLATION: Cost budget exceeded for user ${userId}. Maximum allowed: $${this.config.maxCostPerRequestUsd}`);
    }
  }

  /**
   * Registers cost incurred by a request.
   */
  async registerCost(userId: string, costUsd: number): Promise<void> {
    const key = `simis:cost:user:${userId}`;
    await this.redis.incrbyfloat(key, costUsd);
    await this.redis.expire(key, 86400); // 24-hour rolling window
  }

  async getCurrentCost(userId: string): Promise<number> {
    const key = `simis:cost:user:${userId}`;
    const cost = await this.redis.get(key);
    return cost ? parseFloat(cost) : 0;
  }
}
