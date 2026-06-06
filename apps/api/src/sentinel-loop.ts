import { collectHealthSnapshot } from "@simis/sentinel";
import { evaluateHealth } from "./rollback/orchestrator";

function determineInterval(errorRate: number): number {
  if (errorRate >= 0.05) return 15000; // Unstable
  if (errorRate > 0) return 30000;    // Degraded
  return 60000;                       // Stable
}

export function startSentinelLoop() {
  console.log(`[SENTINEL] Starting dynamic health polling loop...`);
  
  let currentTimer: NodeJS.Timeout;

  async function tick() {
    let nextInterval = 60000; // default stable
    try {
      const snapshot = await collectHealthSnapshot();
      await evaluateHealth(snapshot);
      nextInterval = determineInterval(snapshot.api_error_rate);
    } catch (err) {
      console.error("[SENTINEL] Failed to evaluate health snapshot", err);
      nextInterval = 15000; // fail-safe polling
    } finally {
      currentTimer = setTimeout(tick, nextInterval);
    }
  }

  // Initial kick-off
  currentTimer = setTimeout(tick, 60000);
}
