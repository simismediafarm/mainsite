import { ContextVector, BanditAction } from "../types";

const EPSILON_MIN = 0.05;

export class BanditEngine {
  static state = new Map<string, any>();

  static getKey(ctx: ContextVector) {
    return `${ctx.geo}:${ctx.device}:${ctx.category}:${ctx.time_bucket || "default"}`;
  }

  static select(ctx: ContextVector): BanditAction {
    const key = this.getKey(ctx);

    const actions: BanditAction[] = [
      { type: "AFFILIATE_SLOT", position: "inline" },
      { type: "DISPLAY_AD", position: "sidebar" },
      { type: "CONTENT_ONLY", position: "footer" }
    ];

    if (Math.random() < EPSILON_MIN) {
      return actions[Math.floor(Math.random() * actions.length)];
    }

    const scores = this.state.get(key) || {};

    return actions.sort(
      (a, b) => (scores[b.type]?.value || 0) - (scores[a.type]?.value || 0)
    )[0];
  }

  static update(ctx: ContextVector, action: BanditAction, reward: number) {
    const key = this.getKey(ctx);

    const prev = this.state.get(key) || {};
    const count = (prev[action.type]?.count || 0) + 1;
    const value = ((prev[action.type]?.value || 0) * (count - 1) + reward) / count;

    this.state.set(key, {
      ...prev,
      [action.type]: { value, count }
    });
  }
}
