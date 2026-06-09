import { prisma } from '@simis/database';

export interface SnapshotPayload {
  inputHash: string;
  traceId: string;
  taskType: string;
  modelUsed: string;
  entityId: string;
  scores: {
    entity?: number;
    attention?: number;
    recommendation?: number;
    demand?: number;
    ranking?: number;
    integrity?: number;
    revenue?: number;
    composite?: number;
  };
}

export async function writeSnapshot(payload: SnapshotPayload): Promise<void> {
  const s = payload.scores;
  await prisma.intelligenceSnapshot.create({
    data: {
      inputHash: payload.inputHash,
      traceId: payload.traceId,
      taskType: payload.taskType,
      modelUsed: payload.modelUsed,
      entityId: payload.entityId,
      entityScore: s.entity ?? 0,
      attentionScore: s.attention ?? 0,
      recommendationScore: s.recommendation ?? 0,
      demandScore: s.demand ?? 0,
      rankingScore: s.ranking ?? 0,
      integrityScore: s.integrity ?? 0,
      revenueScore: s.revenue ?? 0,
      compositeIntelligenceScore: s.composite ?? 0,
    },
  });
}
