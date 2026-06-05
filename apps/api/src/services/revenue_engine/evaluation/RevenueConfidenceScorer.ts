import { RevenueSignal } from '../resolvers/RevenueSignalResolver';

export class RevenueConfidenceScorer {
  /**
   * Evaluates the confidence of the revenue score.
   * Weak confidence means insufficient supporting signals.
   */
  public score(signals: RevenueSignal): number {
    let confidence = 1.0;

    // Missing or zero commercial intent reduces confidence significantly
    if (signals.commercialIntentScore < 0.1) {
      confidence *= 0.5;
    }

    // Borderline integrity score creates uncertainty
    if (signals.integrityScore >= 0.4 && signals.integrityScore <= 0.6) {
      confidence *= 0.8;
    }

    // High attention but low authority is a slight anomaly, reducing confidence
    if (signals.attentionScore > 0.8 && signals.authorityScore < 0.3) {
      confidence *= 0.8;
    }

    return Math.min(1.0, Math.max(0.0, confidence));
  }
}
