import { IntegritySignal } from './EngagementSignalResolver';

export class TrafficSignalResolver {
  /**
   * Resolves traffic metrics: velocity, referrer diversity, etc.
   */
  public async resolve(entityId: string): Promise<IntegritySignal[]> {
    // MOCK: Fetch from TrafficMetric
    return [
      { type: 'viewsPerHour', rawValue: 50 },
      { type: 'uniqueReferrers', rawValue: 12 },
      { type: 'directTrafficPct', rawValue: 15 },
      { type: 'botTrafficProbability', rawValue: 0.05 }
    ];
  }
}
