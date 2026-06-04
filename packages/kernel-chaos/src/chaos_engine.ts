import { ChaosPolicy, DEFAULT_CHAOS_POLICY } from "./chaos_policy.js";
import { wrapFetch } from "./wrap_fetch.js";

export class ChaosEngine {
  private policy: ChaosPolicy;

  constructor(policy: ChaosPolicy = DEFAULT_CHAOS_POLICY) {
    this.policy = policy;
  }

  setMode(mode: ChaosPolicy["mode"]) {
    this.policy.mode = mode;
  }

  getPolicy() {
    return this.policy;
  }

  // ONLY ENTRY POINT
  wrap<T extends typeof fetch>(fetchFn: T): T {
    if (this.policy.mode === "NORMAL") return fetchFn;

    return wrapFetch(fetchFn, this.policy) as T;
  }
}
