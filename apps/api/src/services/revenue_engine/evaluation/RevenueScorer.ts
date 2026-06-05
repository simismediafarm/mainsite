import { RevenueSignal } from '../resolvers/RevenueSignalResolver';
import { EvaluatedAction } from './RuleEvaluator';

export interface RevenueResult {
  revenueScore: number;
  monetizationPotential: number;
  confidence: number;
}

export class RevenueScorer {
  /**
   * Calculates the final revenue metrics by combining base signals and resolved actions.
   */
  public score(signals: RevenueSignal, actions: EvaluatedAction[], confidenceScore: number): RevenueResult {
    // Check if denied
    if (actions.some(a => a.type === 'deny')) {
      return { revenueScore: 0.0, monetizationPotential: 0.0, confidence: confidenceScore };
    }

    // Base potential heavily relies on commercial intent and attention
    let basePotential = (signals.commercialIntentScore * 0.6) + (signals.attentionScore * 0.4);

    // Base revenue score relies on upstream ranking & integrity
    let baseRevenueScore = (signals.rankingScore * 0.5) + (signals.integrityScore * 0.5);

    // Apply multiplier action if exists
    const multiplierAction = actions.find(a => a.type === 'multiplier');
    if (multiplierAction) {
      baseRevenueScore *= Number(multiplierAction.value);
      basePotential *= Number(multiplierAction.value);
    }

    // Apply explicit boost/deboost
    if (actions.some(a => a.type === 'boost')) baseRevenueScore += 0.2;
    if (actions.some(a => a.type === 'deboost')) baseRevenueScore -= 0.2;

    return {
      revenueScore: Math.min(1.0, Math.max(0.0, baseRevenueScore)),
      monetizationPotential: Math.min(1.0, Math.max(0.0, basePotential)),
      confidence: confidenceScore
    };
  }
}
