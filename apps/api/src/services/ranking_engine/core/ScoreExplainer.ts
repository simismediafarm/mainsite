export interface FactorContribution {
  slug: string;
  rawValue: number;
  normalizedValue: number;
  weight: number;
  contribution: number;
}

export interface ScoreExplanation {
  traceId: string;
  profileId: string;
  experimentId: string | null;
  finalScore: number;
  factors: FactorContribution[];
  // e.g., { "authority": 0.31, "engagement": 0.28 }
  summary: Record<string, number>;
}

export class ScoreExplainer {
  /**
   * Generates a human-readable explanation of why a ranking score was given.
   */
  public generateExplanation(
    traceId: string,
    profileId: string,
    experimentId: string | null,
    finalScore: number,
    breakdowns: FactorContribution[]
  ): ScoreExplanation {
    const summary: Record<string, number> = {};
    
    for (const breakdown of breakdowns) {
      summary[breakdown.slug] = parseFloat(breakdown.contribution.toFixed(4));
    }

    return {
      traceId,
      profileId,
      experimentId,
      finalScore: parseFloat(finalScore.toFixed(4)),
      factors: breakdowns,
      summary
    };
  }
}
