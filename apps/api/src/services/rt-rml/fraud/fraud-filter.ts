import { RewardSignal } from "../types";

export class FraudFilter {
  static evaluate(r: RewardSignal) {
    if (r.dwell_time < 300) return { valid: false, reward: 0 };
    if (r.ctr > 0.95 && r.dwell_time < 800) return { valid: false, reward: -1 };
    if (r.scroll_depth < 5 && r.conversion) return { valid: false, reward: -1 };

    return { valid: true, reward: this.normalize(r) };
  }

  static normalize(r: RewardSignal) {
    return (
      r.ctr * 0.3 +
      Math.tanh(r.dwell_time / 10000) * 0.3 +
      (r.scroll_depth / 100) * 0.2 +
      (r.conversion ? 1 : 0) * 0.2
    );
  }
}
