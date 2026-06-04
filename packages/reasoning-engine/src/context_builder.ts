export function buildContext(signals: any[]) {
  // HARUS deterministic sort
  // HARUS no external dependency ordering bias
  signals.sort((a, b) => a.id.localeCompare(b.id));

  return {
    sortedSignals: signals,
    aggregatedScore: signals.reduce((acc, s) => acc + s.score, 0) / (signals.length || 1),
    timestamp: Date.now() // Note: In true deterministic OS, this should be logical clock or ECVM seed
  };
}
