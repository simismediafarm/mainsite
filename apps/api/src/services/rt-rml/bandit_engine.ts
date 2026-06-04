import { BanditAction, ContextVector, RewardSignal } from "./types";
import { HybridBanditState } from "./hybrid-state";

export class BanditEngine {
  private static readonly MIN_EXPLORATION_RATE = 0.05;
  private static readonly EPSILON = 0.15;
  private static readonly EXPLORATION_BOOST = 1.2;

  static getContextKey(context: ContextVector): string {
    return `${context.geo}:${context.device}:${context.category}`;
  }

  /**
   * Selects an action using a hybrid Epsilon-Greedy + UCB strategy.
   */
  static async selectAction(context: ContextVector, actions: BanditAction[]): Promise<BanditAction> {
    if (actions.length === 0) throw new Error("No available actions to select.");
    if (actions.length === 1) return actions[0];

    const key = this.getContextKey(context);
    const states = await HybridBanditState.getStates(key, actions);

    const dynamicEpsilon = Math.max(this.EPSILON, this.MIN_EXPLORATION_RATE);

    // 1. Exploration Phase (Random selection among pruned candidates)
    if (Math.random() < dynamicEpsilon) {
      return actions[Math.floor(Math.random() * actions.length)];
    }

    // 2. Exploitation Phase (UCB Scoring)
    let bestAction = actions[0];
    let bestScore = -Infinity;
    
    // Total interactions across all actions for this context
    const totalCount = states.reduce((sum, s) => sum + s.count, 0);

    for (const state of states) {
      const avgReward = state.count > 0 ? state.value / state.count : 0;
      
      const exploration = state.count > 0 && totalCount > 0
        ? Math.sqrt(Math.log(1 + totalCount) / (state.count + 1))
        : this.EXPLORATION_BOOST;

      const score = avgReward + exploration;

      if (score > bestScore) {
        bestScore = score;
        bestAction = state.action;
      }
    }

    return bestAction;
  }

  /**
   * Normalizes disparate reward signals to prevent value drift and layout collapse.
   */
  static normalizeReward(r: RewardSignal): number {
    const normCtr = Math.min(r.ctr, 1);
    const normDwell = Math.tanh(r.dwell_time / 10000); // Tanh scales 0 to ~1
    const normScroll = r.scroll_depth / 100;
    const normConversion = r.conversion ? 1 : 0;
    const normRpm = Math.log(1 + r.rpm); // Logarithmic scaling for huge spikes

    // Weighted fusion to a scalar reward value
    return (normRpm * 0.4) + (normConversion * 0.3) + (normDwell * 0.15) + (normCtr * 0.1) + (normScroll * 0.05);
  }

  /**
   * Updates the bandit's hybrid state based on normalized telemetry.
   */
  static async update(context: ContextVector, action: BanditAction, reward: RewardSignal) {
    const key = this.getContextKey(context);
    const rewardValue = this.normalizeReward(reward);

    await HybridBanditState.updateState(key, action, rewardValue);
  }
}
