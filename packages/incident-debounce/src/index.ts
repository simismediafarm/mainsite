export interface HealthSnapshot {
  timestamp: number;
  api_error_rate: number;
  p95_latency: number;
  prisma_errors: number;
  contract_violations: number;
  deployment_id: string;
}

const DEBOUNCE_WINDOW_MS = 60000; // 60 seconds
const MIN_INCIDENT_COUNT = 3;

// Temporary in-memory state (can be replaced with Redis later)
const incidentHistory: Map<string, HealthSnapshot[]> = new Map();

export function recordIncidentAndCheck(ruleId: string, snapshot: HealthSnapshot): boolean {
  const now = Date.now();
  let history = incidentHistory.get(ruleId) || [];
  
  // Add new snapshot
  history.push(snapshot);
  
  // Prune old snapshots outside the window
  history = history.filter(s => now - s.timestamp <= DEBOUNCE_WINDOW_MS);
  incidentHistory.set(ruleId, history);
  
  // Check if threshold is met
  return history.length >= MIN_INCIDENT_COUNT;
}

export function clearIncidentHistory(ruleId?: string) {
  if (ruleId) {
    incidentHistory.delete(ruleId);
  } else {
    incidentHistory.clear();
  }
}
