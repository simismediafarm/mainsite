import { IntegritySignal } from '../signals/EngagementSignalResolver';

export class AuthenticityScorer {
  /**
   * Probability score for attention authenticity. NOT a binary fraud flag.
   */
  public score(trafficSignals: IntegritySignal[]): number {
    const uniqueReferrers = trafficSignals.find(s => s.type === 'uniqueReferrers')?.rawValue || 0;
    const directTrafficPct = trafficSignals.find(s => s.type === 'directTrafficPct')?.rawValue || 0;
    const botProbability = trafficSignals.find(s => s.type === 'botTrafficProbability')?.rawValue || 0;

    // High diversity is good, high bot probability is bad
    const diversityScore = Math.min(1, uniqueReferrers / 10);
    const directPenalty = directTrafficPct > 80 ? 0.5 : 1.0; // Suspiciously high direct traffic
    const humanProbability = 1.0 - Math.min(1, botProbability);

    const baseScore = (diversityScore * 0.4) + (humanProbability * 0.6);
    return Math.min(1, Math.max(0, baseScore * directPenalty));
  }
}
