export function diffExecution(live: any[], replay: any[]) {
  return {
    missing_in_replay: live.filter(x => !replay.includes(x)),
    extra_in_replay: replay.filter(x => !live.includes(x)),
    drift_score: computeDrift(live, replay)
  };
}

function computeDrift(live: any[], replay: any[]): number {
  if (live.length !== replay.length) return 1.0;
  return 0.0;
}
