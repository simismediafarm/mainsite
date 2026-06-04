export type SignalType =
  | "TREND_SIGNAL"
  | "VALUE_SIGNAL"
  | "ANOMALY_SIGNAL"
  | "CONTENT_GAP"
  | "REVENUE_OPPORTUNITY";

export interface Signal {
  id: string;
  entity_id: string;
  type: SignalType;

  score: number; // 0 - 1 deterministic
  confidence: number;

  metadata: {
    source_hash: string;
    embedding_cluster: string;
    reasoning_path: string;
  };

  created_at: number;
}
