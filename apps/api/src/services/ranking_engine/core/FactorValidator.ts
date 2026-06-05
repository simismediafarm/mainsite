import { FactorMetadata } from './FactorNormalizer';

export class FactorValidator {
  /**
   * Validates raw factor scores before they enter the normalization pipeline.
   * Rejects NaN, Infinity, and out-of-bounds values.
   */
  public validate(rawScore: number, metadata: FactorMetadata): void {
    if (Number.isNaN(rawScore)) {
      throw new Error(`Validation failed for factor [${metadata.slug}]: Value is NaN`);
    }

    if (!Number.isFinite(rawScore)) {
      throw new Error(`Validation failed for factor [${metadata.slug}]: Value is Infinity`);
    }

    // Example logic for rejecting negative values for specific metric types
    if (metadata.type !== 'zscore' && rawScore < 0) {
      // In many metrics (views, duration), negative is forbidden
      // For Z-scores, negative is fine.
      throw new Error(`Validation failed for factor [${metadata.slug}]: Negative value (${rawScore}) not allowed for type ${metadata.type}`);
    }

    // Could also check against metadata.minValue and maxValue if strict bounds are required
  }
}
