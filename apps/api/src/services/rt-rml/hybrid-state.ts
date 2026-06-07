import { createRedisClient } from "@simis/config";
import { getSupabase } from "@simis/kernel-graph/dist/executor/kernelExecutor";
import { BanditState, BanditAction } from "./types";

const redis = createRedisClient();

redis.on("error", (err) => {
  console.warn("[Redis Hybrid State] Connection warning (safe to ignore in non-Redis environments):", err.message);
});

export class HybridBanditState {
  static getKey(contextKey: string, actionType: string): string {
    return `rtrml:bandit:${contextKey}:${actionType}`;
  }

  /**
   * Fetch hot state from Redis, fallback to DB if missing.
   */
  static async getState(contextKey: string, action: BanditAction): Promise<BanditState> {
    const key = this.getKey(contextKey, action.type);
    
    // 1. Try fast path
    const cached = await redis.hgetall(key);
    if (cached && cached.value && cached.count) {
      return {
        action,
        value: parseFloat(cached.value),
        count: parseInt(cached.count, 10),
      };
    }

    // 2. Slow path fallback (Postgres)
    const supabase = getSupabase();
    const { data } = await supabase
      .from('bandit_reward_states')
      .select('value, count')
      .eq('context_key', contextKey)
      .eq('action_type', action.type)
      .single();

    if (data) {
      // Warm up redis
      await redis.hset(key, { value: data.value, count: data.count });
      return { action, value: data.value, count: data.count };
    }

    // 3. Unseen state
    return { action, value: 0, count: 0 };
  }

  /**
   * Batch fetch all states for a given context and action space.
   */
  static async getStates(contextKey: string, actions: BanditAction[]): Promise<BanditState[]> {
    return Promise.all(actions.map(a => this.getState(contextKey, a)));
  }

  /**
   * Update hot state and conditionally checkpoint to DB.
   */
  static async updateState(contextKey: string, action: BanditAction, incrementalValue: number) {
    const key = this.getKey(contextKey, action.type);
    
    // Atomically increment in Redis
    const newCount = await redis.hincrby(key, 'count', 1);
    const newValueRaw = await redis.hincrbyfloat(key, 'value', incrementalValue);
    const newValue = parseFloat(newValueRaw);

    // Checkpoint every 50 updates
    if (newCount % 50 === 0) {
      const supabase = getSupabase();
      await supabase.from('bandit_reward_states').upsert({
        context_key: contextKey,
        action_type: action.type,
        value: newValue,
        count: newCount,
        updated_at: new Date().toISOString()
      }, { onConflict: 'context_key, action_type' });
    }
  }
}
