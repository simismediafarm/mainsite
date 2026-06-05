export type NormalizationMethod = 'minmax' | 'zscore' | 'logarithmic' | 'sigmoid';

export interface FactorMetadata {
  id: string;
  slug: string;
  type: string;
  minValue: number | null;
  maxValue: number | null;
  defaultWeight: number | null;
  normalizationMethod: string | null;
}

export class FactorNormalizer {
  /**
   * Normalizes a raw score to a 0.0 - 1.0 range based on the factor's metadata.
   */
  public normalize(rawScore: number, metadata: FactorMetadata): number {
    const method = (metadata.normalizationMethod || 'minmax') as NormalizationMethod;

    switch (method) {
      case 'minmax':
        return this.applyMinMax(rawScore, metadata.minValue, metadata.maxValue);
      case 'logarithmic':
        return this.applyLogarithmic(rawScore, metadata.maxValue);
      case 'sigmoid':
        return this.applySigmoid(rawScore);
      case 'zscore':
        // Z-score usually requires population mean/stddev which we might not have per item.
        // Assuming rawScore is already a pre-calculated z-score, we map it to 0-1.
        return this.applyZScoreToSigmoid(rawScore);
      default:
        // Fallback to min-max if unknown
        return this.applyMinMax(rawScore, metadata.minValue, metadata.maxValue);
    }
  }

  private applyMinMax(score: number, min: number | null, max: number | null): number {
    const safeMin = min ?? 0;
    const safeMax = max ?? 100;
    
    if (safeMax === safeMin) return 0;
    
    // Clamp score
    const clampedScore = Math.max(safeMin, Math.min(safeMax, score));
    return (clampedScore - safeMin) / (safeMax - safeMin);
  }

  private applyLogarithmic(score: number, max: number | null): number {
    const safeScore = Math.max(0, score); // avoid log of negative
    const logScore = Math.log1p(safeScore);
    
    if (max) {
      const logMax = Math.log1p(max);
      return Math.min(1, logScore / logMax);
    }
    
    // Without max, soft plateau
    return 1 - (1 / (1 + logScore));
  }

  private applySigmoid(score: number): number {
    // Basic sigmoid, usually expects centered data
    return 1 / (1 + Math.exp(-score));
  }

  private applyZScoreToSigmoid(zScore: number): number {
    // Map Z-Score roughly to 0-1 using standard normal CDF approximation or sigmoid
    return 1 / (1 + Math.exp(-zScore * 1.702)); // 1.702 is scaling factor to match normal CDF
  }
}
