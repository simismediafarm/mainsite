export interface RankingExplainResponse {
  traceId: string;
  score: number;
  factors: Array<{
    slug: string;
    rawValue: number;
    normalizedValue: number;
    weight: number;
    contribution: number;
  }>;
}

export interface IntegrityExplainResponse {
  traceId: string;
  engagementQualityScore: number;
  sessionQualityScore: number;
  attentionAuthenticityScore: number;
  integrityScore: number;
  summary: {
    engagementQualityDesc: string;
    sessionQualityDesc: string;
    authenticityDesc: string;
  };
}

export interface RevenueExplainResponse {
  traceId: string;
  revenueScore: number;
  monetizationPotential: number;
  confidence: number;
  summary: {
    revenueScoreDesc: string;
    confidenceDesc: string;
  };
  rulesFired: Array<{ ruleId: string; type: string; value: number | string }>;
}

export interface TraceExplorerResponse {
  traceId: string;
  rankingEvents: any[];
  integrityEvents: any[];
  revenueEvents: any[];
  anomalies: any[];
  snapshots: {
    ranking: any | null;
    integrity: any | null;
    revenue: any | null;
  };
}

export interface SystemHealthResponse {
  ranking: number;
  integrity: number;
  revenue: number;
  overall: number;
}
