import { ChaosPolicy } from "./chaos_policy.js";

export function wrapFetch(fetchFn: typeof fetch, policy: ChaosPolicy): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit) => {

    // 1. LATENCY INJECTION (ENV ONLY)
    const [min, max] = policy.config.latencyMsRange;
    const latency = Math.random() * (max - min) + min;

    await new Promise(res => setTimeout(res, latency));

    // 2. NETWORK PARTITION SIMULATION
    if (Math.random() < policy.config.networkPartitionProbability) {
      throw new Error("[CHAOS] Network Partition Simulated");
    }

    // 3. RATE LIMIT SIMULATION
    if (Math.random() < policy.config.rateLimitProbability) {
      const err = new Error("[CHAOS] Rate Limited (429 simulated)");
      (err as any).status = 429;
      throw err;
    }

    // 4. NORMAL FETCH (REALITY LAYER)
    return fetchFn(input, init);
  };
}
