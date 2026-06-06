import Redis from 'ioredis';

export type KillSwitchState = 'NORMAL' | 'DEGRADED_MODE' | 'CACHE_ONLY_MODE' | 'EMERGENCY_SHUTDOWN';

export interface KillSwitchConfig {
  maxErrorRate: number;
  maxCostPerRequestUsd: number;
  maxFallbackDepth: number;
  mode: KillSwitchState;
}

const DEFAULT_HARDCODED_VALUES: KillSwitchConfig = {
  maxErrorRate: 0.2,
  maxCostPerRequestUsd: 0.01,
  maxFallbackDepth: 3,
  mode: 'NORMAL'
};

export class KillSwitch {
  private redis: Redis;
  private config: KillSwitchConfig;

  constructor(redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379') {
    this.redis = new Redis(redisUrl);
    
    // HYBRID_ENFORCEMENT Policy
    this.config = {
      maxErrorRate: process.env.MAX_ERROR_RATE 
        ? parseFloat(process.env.MAX_ERROR_RATE) 
        : DEFAULT_HARDCODED_VALUES.maxErrorRate,
        
      maxCostPerRequestUsd: process.env.MAX_COST_PER_REQUEST_USD 
        ? parseFloat(process.env.MAX_COST_PER_REQUEST_USD) 
        : DEFAULT_HARDCODED_VALUES.maxCostPerRequestUsd,
        
      maxFallbackDepth: process.env.MAX_FALLBACK_DEPTH 
        ? parseInt(process.env.MAX_FALLBACK_DEPTH, 10) 
        : DEFAULT_HARDCODED_VALUES.maxFallbackDepth,
        
      mode: (process.env.KILL_SWITCH_MODE as KillSwitchState) || DEFAULT_HARDCODED_VALUES.mode,
    };
  }

  async getState(): Promise<KillSwitchState> {
    const overrideState = await this.redis.get('simis:killswitch:state');
    if (overrideState) {
      return overrideState as KillSwitchState;
    }
    return this.config.mode;
  }

  async setState(state: KillSwitchState): Promise<void> {
    await this.redis.set('simis:killswitch:state', state);
  }

  async recordFailure(): Promise<void> {
    const key = 'simis:killswitch:failures';
    await this.redis.eval(`
      local current = redis.call("INCR", KEYS[1])
      if current == 1 then
        redis.call("EXPIRE", KEYS[1], 60)
      end
      return current
    `, 1, key);

    const failuresStr = await this.redis.get(key);
    const failures = failuresStr ? parseInt(failuresStr, 10) : 0;

    // Fail-Closed Logic: Too many failures trigger Cache-Only Mode
    if (failures >= 5) {
      await this.setState('CACHE_ONLY_MODE');
    }
  }

  async reset(): Promise<void> {
    await this.redis.del('simis:killswitch:failures');
    await this.redis.del('simis:killswitch:state');
  }
}
