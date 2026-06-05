import { IntegritySignal } from './EngagementSignalResolver';

export class SessionSignalResolver {
  /**
   * Resolves raw session metrics: scroll depth, time on page, etc.
   */
  public async resolve(entityId: string): Promise<IntegritySignal[]> {
    // MOCK: Fetch from SessionMetric
    return [
      { type: 'avgTimeOnPageSecs', rawValue: 120 },
      { type: 'avgScrollDepthPct', rawValue: 65 },
      { type: 'sessionDurationSecs', rawValue: 300 }
    ];
  }
}
