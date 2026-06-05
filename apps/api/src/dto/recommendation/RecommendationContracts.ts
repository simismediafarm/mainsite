export interface RecommendationSnapshotDTO {
  entityId: string;
  recommendationScore: number;
  candidateCount: number;
  diversityScore: number;
  traceId: string;
}

export interface CandidateGenerationDTO {
  traceId: string;
  candidates: Array<{
    entityId: string;
    sourceScore: number;
    sourceType: 'ranking' | 'entity' | 'attention';
  }>;
}
