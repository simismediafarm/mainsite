import { RevenueResult } from './RevenueScorer';
import { EvaluatedAction } from './RuleEvaluator';
import { RevenueSignal } from '../resolvers/RevenueSignalResolver';

export interface RevenueExplanation {
  traceId: string;
  summary: {
    revenueScoreDesc: string;
    confidenceDesc: string;
  };
  rulesFired: EvaluatedAction[];
  signals: Record<string, number>;
}

export class RevenueExplainer {
  public generate(
    traceId: string,
    result: RevenueResult,
    actions: EvaluatedAction[],
    signals: RevenueSignal
  ): RevenueExplanation {
    return {
      traceId,
      summary: {
        revenueScoreDesc: this.describeScore(result.revenueScore),
        confidenceDesc: this.describeConfidence(result.confidence)
      },
      rulesFired: actions,
      signals: {
        rankingScore: signals.rankingScore,
        integrityScore: signals.integrityScore,
        authorityScore: signals.authorityScore,
        attentionScore: signals.attentionScore,
        commercialIntentScore: signals.commercialIntentScore
      }
    };
  }

  private describeScore(score: number): string {
    if (score > 0.8) return 'High yield optimization potential';
    if (score > 0.4) return 'Standard monetization applied';
    return 'Monetization restricted or deboosted';
  }

  private describeConfidence(confidence: number): string {
    if (confidence > 0.8) return 'Strong signal backing';
    if (confidence > 0.4) return 'Moderate uncertainty in signals';
    return 'Insufficient supporting signals, high uncertainty';
  }
}
