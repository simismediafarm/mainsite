export interface AttentionSnapshotDTO {
  entityId: string;
  attentionScore: number;
  attentionQualityScore: number;
  attentionAuthenticityScore: number;
  traceId: string;
}

export interface AttentionSessionDTO {
  sessionId: string;
  entityId: string;
  durationMs: number;
  scrollDepth: number;
}
