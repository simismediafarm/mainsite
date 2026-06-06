import Redis from 'ioredis';
import { CostGovernor } from './cost-governor';
import { KillSwitch } from './kill-switch';

export type TaskType =
  | "entity_extraction"
  | "fast_classification"
  | "trend_detection"
  | "general_reasoning"
  | "seo_generation"
  | "attention_processing"
  | "recommendation_generation";

export type Provider = "openrouter" | "gemini" | "deepseek" | "grok" | "cache";

export interface RouteDecision {
  provider: Provider;
  fallback: Provider[];
}

export interface GovernanceInput {
  task: TaskType;
  userId?: string;
  userPriority?: number;
  costBudgetRemaining?: number;
  cacheHitProbability?: number;
}

interface ProviderScore {
  provider: Provider;
  utility: number;
}

export class AIRouter {
  private redis: Redis;
  private openrouterQuotaLimit = 50;
  private costGovernor: CostGovernor;
  private killSwitch: KillSwitch;

  // Central Cost/Latency/Risk Engine Weights
  private weights = {
    cost: 0.5,
    latency: 0.3,
    quality: 0.15,
    risk: 0.05
  };

  // Base metrics (1-10 scale where 10 is highest/most expensive/riskiest/best quality)
  private metrics: Record<Exclude<Provider, "cache">, { cost: number, latency: number, quality: number, risk: number }> = {
    deepseek:   { cost: 2, latency: 4, quality: 8, risk: 3 },
    grok:       { cost: 3, latency: 2, quality: 7, risk: 4 },
    gemini:     { cost: 5, latency: 3, quality: 9, risk: 2 },
    openrouter: { cost: 6, latency: 6, quality: 9, risk: 5 }
  };

  constructor(redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379') {
    this.redis = new Redis(redisUrl);
    this.costGovernor = new CostGovernor(redisUrl);
    this.killSwitch = new KillSwitch(redisUrl);
  }

  /**
   * ENFORCEMENT: Render Execution Lock
   * Verifies that heavy synchronous tasks are not run directly via API calls from Vercel.
   * Forces them to be routed via QStash.
   */
  public assertAsyncExecutionOnly(env: string = process.env.NODE_ENV || "production"): void {
    if (env === "production" && !process.env.QSTASH_TOKEN) {
      throw new Error("RENDER_EXECUTION_LOCK_VIOLATION: Direct synchronous AI execution forbidden. Must route via QStash.");
    }
  }

  async getQuotaUsed(): Promise<number> {
    const used = await this.redis.get('simis:ai:quota:openrouter');
    return used ? parseInt(used, 10) : 0;
  }

  async markFailure(provider: Provider): Promise<void> {
    const key = `simis:ai:health:${provider}`;
    await this.redis.eval(`
      local current = redis.call("INCR", KEYS[1])
      if current == 1 then
        redis.call("EXPIRE", KEYS[1], 60)
      end
      return current
    `, 1, key);
  }

  async isHealthy(provider: Provider): Promise<boolean> {
    if (provider === "cache") return true;
    const failures = await this.redis.get(`simis:ai:health:${provider}`);
    return (failures ? parseInt(failures, 10) : 0) < 5;
  }

  private calculateUtility(provider: Exclude<Provider, "cache">): number {
    const m = this.metrics[provider];
    // Invert negative factors (cost, latency, risk) so higher is better
    const costScore = 10 - m.cost;
    const latencyScore = 10 - m.latency;
    const riskScore = 10 - m.risk;

    return (
      (costScore * this.weights.cost) +
      (latencyScore * this.weights.latency) +
      (m.quality * this.weights.quality) +
      (riskScore * this.weights.risk)
    );
  }

  /**
   * Single Decision Authority: Calculate best provider based on real-time metrics and health.
   */
  async route(input: GovernanceInput | TaskType): Promise<RouteDecision> {
    // Enforcement check
    this.assertAsyncExecutionOnly();

    const task = typeof input === "string" ? input : input.task;
    const userId = typeof input === "string" ? undefined : input.userId;

    // 1. Kill Switch Enforcement (Fail-Closed)
    const killSwitchState = await this.killSwitch.getState();
    if (killSwitchState === 'EMERGENCY_SHUTDOWN') {
      throw new Error("KILL_SWITCH_ACTIVE: System is in EMERGENCY_SHUTDOWN. AI routing blocked.");
    }
    if (killSwitchState === 'CACHE_ONLY_MODE') {
      return { provider: "cache", fallback: [] };
    }

    // 2. Cost Governor Budget Check
    try {
      if (userId) {
        await this.costGovernor.assertBudgetAvailable(userId);
      }
    } catch (e) {
      await this.killSwitch.recordFailure(); // Register budget overruns as failure events
      return { provider: "cache", fallback: [] }; // Fail gracefully to cache if budget exceeded
    }
    
    // Evaluate scores for all providers
    const scores: ProviderScore[] = [];
    for (const provider of Object.keys(this.metrics) as Exclude<Provider, "cache">[]) {
      if (await this.isHealthy(provider)) {
        let utility = this.calculateUtility(provider);

        // Adjust specific utility based on task rules
        if (task === "trend_detection" && provider === "grok") utility += 2.0; // Grok is fast for trends
        if (task === "general_reasoning" && provider === "openrouter") {
          const used = await this.getQuotaUsed();
          if (used >= this.openrouterQuotaLimit) {
            utility -= 100; // Deprioritize if quota exceeded
          }
        }

        scores.push({ provider, utility });
      }
    }

    // Sort by highest utility
    scores.sort((a, b) => b.utility - a.utility);

    // Provide default fallback if everything fails
    if (scores.length === 0) {
      return { provider: "cache", fallback: [] };
    }

    const winner = scores[0].provider;
    const fallback = scores.slice(1).map(s => s.provider);
    fallback.push("cache"); // Always append cache to end of fallback chain

    // Increment quota if OpenRouter won
    if (winner === "openrouter") {
      await this.incrementQuotaUsage();
    }

    return {
      provider: winner,
      fallback
    };
  }

  async incrementQuotaUsage(amount: number = 1): Promise<void> {
    const key = 'simis:ai:quota:openrouter';
    await this.redis.eval(`
      local current = redis.call("INCRBY", KEYS[1], ARGV[1])
      if current == tonumber(ARGV[1]) then
        redis.call("EXPIRE", KEYS[1], 86400)
      end
      return current
    `, 1, key, amount);
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
