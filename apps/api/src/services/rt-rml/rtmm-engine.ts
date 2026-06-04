import { ContextVector, BanditAction } from "./types";
import { MarketClearingEngine } from "./market-clearing-engine";
import { BanditEngine } from "./bandit_engine";

export class RTMMEngine {
  private static readonly GLOBAL_ACTIONS: BanditAction[] = [
    { type: "AFFILIATE_SLOT", position: "inline" },
    { type: "DISPLAY_AD", position: "sidebar" },
    { type: "SPONSORED_CARD", position: "above_fold" },
    { type: "CONTENT_ONLY", position: "inline" }
  ];

  /**
   * Orchestrates the Two-Layer Intelligence System:
   * Layer 1: Market Engine Pruning (Constraints)
   * Layer 2: Bandit Engine (Adaptive Optimization)
   */
  static async resolveMonetizationSlot(context: ContextVector): Promise<BanditAction> {
    // 1. MarketClearingEngine computes base deterministic score
    const scoredActions = MarketClearingEngine.computeActionScores(context, this.GLOBAL_ACTIONS);

    // 2. Action Space Pruning (Drop any actions falling below threshold)
    const allowedActions = MarketClearingEngine.pruneActionSpace(scoredActions, 0.5);

    // 3. BanditEngine runs contextual selection on pruned actions
    const selectedAction = await BanditEngine.selectAction(context, allowedActions);

    return selectedAction;
  }

  /**
   * Integrates the resolved monetization slot into the feed.
   * This is where RT-RML overrides the static monetization DSL rules.
   */
  static async applyToFeed(feed: any[], context: ContextVector): Promise<any[]> {
    const slot = await this.resolveMonetizationSlot(context);

    // In a real application, you might inject this slot at specific positions
    // or modify the first few items based on layout constraints.
    // We bind the bandit decision to the top-level items.
    return feed.map((item, index) => {
      // Example strategy: Apply bandit slot action to the top ranking item or a specific interval
      if (index === 0 || index === 3) {
        return {
          ...item,
          monetization_slot: slot,
        };
      }
      return item;
    });
  }
}
