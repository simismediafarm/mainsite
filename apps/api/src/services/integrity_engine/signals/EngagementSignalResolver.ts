export interface IntegritySignal {
  type: string;
  rawValue: number;
  metadata?: any;
}

export class EngagementSignalResolver {
  /**
   * Resolves raw engagement metrics: views, engagements, bounce, etc.
   */
  public async resolve(entityId: string): Promise<IntegritySignal[]> {
    // MOCK: Fetch from ContentMetric
    return [
      { type: 'views', rawValue: 1000 },
      { type: 'engagements', rawValue: 150 },
      { type: 'comments', rawValue: 12 },
      { type: 'shares', rawValue: 5 }
    ];
  }
}
