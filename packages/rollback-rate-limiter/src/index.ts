const MAX_ROLLBACKS_PER_HOUR = 2;
const MAX_ROLLBACKS_PER_24H = 4;
const ONE_HOUR_MS = 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Temporary in-memory state (can be replaced with Redis later)
let rollbackTimestamps: number[] = [];

export function recordRollbackAndCheckLimit(): "ALLOWED" | "RATE_LIMIT_EXCEEDED" {
  const now = Date.now();
  
  // Add new rollback
  rollbackTimestamps.push(now);
  
  // Clean up timestamps older than 24h
  rollbackTimestamps = rollbackTimestamps.filter(t => now - t <= TWENTY_FOUR_HOURS_MS);
  
  const inLastHour = rollbackTimestamps.filter(t => now - t <= ONE_HOUR_MS).length;
  const inLast24h = rollbackTimestamps.length;
  
  if (inLastHour > MAX_ROLLBACKS_PER_HOUR || inLast24h > MAX_ROLLBACKS_PER_24H) {
    return "RATE_LIMIT_EXCEEDED";
  }
  
  return "ALLOWED";
}
