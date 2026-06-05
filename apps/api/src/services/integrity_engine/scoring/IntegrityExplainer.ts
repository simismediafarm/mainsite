export interface IntegrityExplanation {
  traceId: string;
  summary: {
    engagementQualityDesc: string;
    sessionQualityDesc: string;
    authenticityDesc: string;
  };
  signals: {
    type: string;
    value: number;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
}

export class IntegrityExplainer {
  public generate(
    traceId: string,
    engQuality: number,
    sessQuality: number,
    authScore: number,
    signals: any[]
  ): IntegrityExplanation {
    return {
      traceId,
      summary: {
        engagementQualityDesc: engQuality > 0.7 ? 'High relative engagement' : 'Low engagement volume vs views',
        sessionQualityDesc: sessQuality > 0.6 ? 'Healthy session depth and duration' : 'Shallow sessions detected',
        authenticityDesc: authScore > 0.8 ? 'Highly authentic traffic patterns' : 'Suspicious traffic velocity or low diversity'
      },
      signals: signals.map(s => ({
        type: s.type,
        value: s.rawValue,
        impact: this.determineImpact(s.type, s.rawValue)
      }))
    };
  }

  private determineImpact(type: string, value: number): 'positive' | 'negative' | 'neutral' {
    if (type === 'botTrafficProbability' && value > 0.2) return 'negative';
    if (type === 'avgTimeOnPageSecs' && value > 60) return 'positive';
    if (type === 'uniqueReferrers' && value > 5) return 'positive';
    return 'neutral';
  }
}
