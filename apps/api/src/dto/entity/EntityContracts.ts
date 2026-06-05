export interface EntitySnapshotDTO {
  entityId: string;
  authorityScore: number;
  trustScore: number;
  popularityScore: number;
  velocityScore: number;
  overallEntityScore: number;
  traceId: string;
  snapshotVersion: number;
}

export interface EntityGraphDTO {
  versionId: string;
  relationships: Array<{
    targetId: string;
    type: string;
    weight: number;
  }>;
}
