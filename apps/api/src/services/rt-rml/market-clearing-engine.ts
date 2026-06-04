import { BanditAction, ContextVector } from "./types";

export class MarketClearingEngine {
  /**
   * Computes deterministic market scores for allowed monetization actions.
   * This score is used as an arbitration threshold BEFORE the Bandit runs.
   */
  static computeActionScores(
    context: ContextVector,
    availableActions: BanditAction[]
  ): BanditAction[] {
    const geoMultiplier = context.geo === "US" ? 1.5 : context.geo === "UK" ? 1.3 : 1.0;
    
    // Evaluate the baseline value for each potential slot action
    return availableActions.map(action => {
      let baseScore = 0;
      switch (action.type) {
        case "AFFILIATE_SLOT":
          baseScore = 0.8 * geoMultiplier;
          break;
        case "DISPLAY_AD":
          baseScore = 0.5 * geoMultiplier;
          break;
        case "SPONSORED_CARD":
          baseScore = 0.9 * geoMultiplier;
          break;
        case "CONTENT_ONLY":
          baseScore = 0.4; // Stable UX baseline
          break;
      }

      return {
        ...action,
        market_score: baseScore,
      };
    });
  }

  /**
   * Prunes actions that fall below the minimum market value threshold
   * to prevent the Bandit from exploring garbage monetization states.
   */
  static pruneActionSpace(actions: BanditAction[], threshold: number = 0.5): BanditAction[] {
    const allowed = actions.filter(a => (a.market_score || 0) >= threshold);
    // Always guarantee at least one safe fallback
    if (allowed.length === 0) {
      return actions.filter(a => a.type === "CONTENT_ONLY");
    }
    return allowed;
  }
}
