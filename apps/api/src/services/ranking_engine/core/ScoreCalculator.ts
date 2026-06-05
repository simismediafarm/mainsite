import { FactorNormalizer } from './FactorNormalizer';
import { ResolvedFactor } from '../resolvers/FactorResolver';

export interface FactorContribution {
  slug: string;
  rawValue: number;
  normalizedValue: number;
  weight: number;
  contribution: number;
}

export interface CalculationResult {
  score: number;
  factors: FactorContribution[];
}

export class ScoreCalculator {
  private normalizer: FactorNormalizer;

  constructor() {
    this.normalizer = new FactorNormalizer();
  }

  /**
   * Pipeline: Resolved Factors -> Normalization -> Weight Application -> Final Score
   */
  public calculate(resolvedFactors: ResolvedFactor[], weights: Record<string, number>): CalculationResult {
    let finalScore = 0;
    const factorContributions: FactorContribution[] = [];

    for (const factor of resolvedFactors) {
      // 1. Get explicit weight from profile or default from metadata
      const weight = weights[factor.slug] !== undefined ? weights[factor.slug] : (factor.metadata.defaultWeight || 0);

      // 2. Normalize
      const normalizedValue = this.normalizer.normalize(factor.rawValue, factor.metadata);

      // 3. Weight Application
      const contribution = normalizedValue * weight;

      // 4. Summation
      finalScore += contribution;

      factorContributions.push({
        slug: factor.slug,
        rawValue: factor.rawValue,
        normalizedValue: normalizedValue,
        weight: weight,
        contribution: contribution
      });
    }

    // 5. Clamp between 0 and 1
    const clampedScore = Math.max(0, Math.min(1, finalScore));

    return {
      score: clampedScore,
      factors: factorContributions
    };
  }
}
