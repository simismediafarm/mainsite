import { BanditEngine } from "../bandit/bandit-engine";
import { SafeRLGuard } from "./safe-rl-guard";
import { ContextVector, BanditAction } from "../types";

export class RTMMOrchestrator {
  static resolve(ctx: ContextVector): BanditAction {
    if (!SafeRLGuard.isActive()) {
      return this.fallback(ctx);
    }

    return BanditEngine.select(ctx);
  }

  static fallback(ctx: ContextVector): BanditAction {
    return {
      type: "DISPLAY_AD",
      position: "sidebar"
    };
  }
}
