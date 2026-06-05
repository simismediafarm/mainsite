export interface DriftAnalysisResult {
  driftDetected: boolean;
  factor: string | null;
  severity: 'none' | 'low' | 'medium' | 'high';
  reason?: string;
}

export class RankingDriftAnalyzer {
  /**
   * Detects score collapse, weight explosion, and normalization anomalies.
   * This operates on the output of the Score Calculator.
   */
  public analyze(finalScore: number, factors: any[]): DriftAnalysisResult {
    // 1. Score Collapse Detection (Is the score suspiciously low despite positive inputs?)
    if (finalScore < 0.05 && factors.length > 0) {
      const allPositive = factors.every(f => f.rawValue > 0);
      if (allPositive) {
        return {
          driftDetected: true,
          factor: 'Aggregate',
          severity: 'high',
          reason: 'Score Collapse: Final score near zero despite positive raw inputs.'
        };
      }
    }

    // 2. Weight Explosion Detection (Does one factor dominate >90% of the score?)
    for (const factor of factors) {
      if (finalScore > 0 && factor.contribution > 0) {
        const dominanceRatio = factor.contribution / finalScore;
        if (dominanceRatio > 0.90 && factors.length > 1) {
          return {
            driftDetected: true,
            factor: factor.slug,
            severity: 'medium',
            reason: `Weight Explosion: Factor [${factor.slug}] dominates ${Math.round(dominanceRatio * 100)}% of the final score.`
          };
        }
      }

      // 3. Normalization Anomaly (Normalized value hits exact 0 or 1 edge case unnaturally)
      if (factor.normalizedValue === 1.0 && factor.rawValue < (factor.metadata?.maxValue || Infinity) * 0.1) {
         // This implies it reached max score with only 10% of the expected max range.
         return {
           driftDetected: true,
           factor: factor.slug,
           severity: 'low',
           reason: `Normalization Anomaly: Factor [${factor.slug}] saturated too early.`
         };
      }
    }

    return {
      driftDetected: false,
      factor: null,
      severity: 'none'
    };
  }
}
