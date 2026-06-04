import { Signal } from "./types.js";

export function detectTrend(signals: Signal[]) {

  const trendMap = new Map<string, number>();

  for (const s of signals) {
    trendMap.set(
      s.type,
      (trendMap.get(s.type) || 0) + s.score
    );
  }

  return Array.from(trendMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type, score]) => ({
      type,
      score,
      normalized: score / signals.length
    }));
}
