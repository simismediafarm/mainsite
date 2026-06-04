export interface ClientTelemetryEvent {
  session_id: string;
  content_id: string;
  event_type: 'view' | 'scroll' | 'click' | 'exit';
  dwell_time_ms?: number;
  timestamp: number;
  geo?: string;
}

const velocityBuckets = new Map<string, { count: number, resetAt: number }>();

export class EngagementIntegrityFilter {
  static readonly MAX_EVENTS_PER_MIN = 50;

  /**
   * Rejects bot signals such as rapid clicks, zero-dwell, or scroll jitter.
   * Enforces velocity caps (max 50 events/min per session).
   * Checks geo consistency (basic entropy check).
   */
  static isLegitimateSignal(event: ClientTelemetryEvent, sessionGeo: string): boolean {
    if (!event.session_id || !event.content_id) {
      return false;
    }

    // 1. Velocity Cap (50 events / min per session)
    const now = Date.now();
    const bucket = velocityBuckets.get(event.session_id) || { count: 0, resetAt: now + 60000 };
    if (now > bucket.resetAt) {
      bucket.count = 1;
      bucket.resetAt = now + 60000;
    } else {
      bucket.count++;
    }
    velocityBuckets.set(event.session_id, bucket);

    if (bucket.count > this.MAX_EVENTS_PER_MIN) {
      console.warn(`[Integrity] Session ${event.session_id} exceeded velocity cap.`);
      return false; // Bot: spamming telemetry
    }

    // 2. Geo Consistency (Entropy Check)
    if (event.geo && event.geo !== sessionGeo) {
      console.warn(`[Integrity] Session ${event.session_id} failed geo consistency (${event.geo} vs ${sessionGeo}).`);
      return false; // VPN toggle / spoofing detected
    }

    // 3. Zero-dwell and jitter rules
    if (event.event_type === 'click') {
      if (event.dwell_time_ms !== undefined && event.dwell_time_ms < 500) {
        return false; // Bot: clicked too fast after view
      }
    }

    if (event.event_type === 'scroll' || event.event_type === 'exit') {
      if (event.dwell_time_ms !== undefined && event.dwell_time_ms < 100) {
        return false; // Bot: scrolled or exited instantly
      }
    }

    return true;
  }
}
