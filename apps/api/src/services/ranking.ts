/**
 * ranking.ts — Monetization-Aware Dynamic Feed Ranking Engine
 */

export interface RankingSignals {
  freshness: number;            // [0.0 - 1.0] Based on age decay
  authority: number;            // [0.0 - 1.0] Source trust score
  engagement_prediction: number; // [0.0 - 1.0] Predicted click/interaction CTR
  seo_score: number;            // [0.0 - 1.0] Optimization / Search potential
  monetization_weight: number;  // [0.0 - 1.0] Direct affiliate / sponsor value
}

/**
 * Computes dynamic score matching the target formula:
 * final_score = (freshness * 0.25) + (authority * 0.20) + (engagement_prediction * 0.25) + (seo_score * 0.10) + (monetization_weight * 0.20)
 */
export function computeRankingScore(signals: RankingSignals): number {
  return (
    signals.freshness * 0.25 +
    signals.authority * 0.20 +
    signals.engagement_prediction * 0.25 +
    signals.seo_score * 0.10 +
    signals.monetization_weight * 0.20
  );
}

/**
 * Calculates freshness decay over time.
 * Freshness falls by half every 72 hours.
 */
export function calculateFreshness(createdAtStr: string): number {
  const created = new Date(createdAtStr).getTime();
  const now = Date.now();
  const diffHours = Math.max(0, (now - created) / (1000 * 60 * 60));
  
  // Exponential decay: w = 2^(-t / 72)
  return Math.pow(2, -diffHours / 72);
}
