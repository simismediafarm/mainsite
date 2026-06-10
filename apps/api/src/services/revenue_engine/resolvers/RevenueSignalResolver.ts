import { prisma } from '../../../prisma';

export interface RevenueSignal {
  rankingScore: number;
  integrityScore: number;
  authorityScore: number;
  attentionScore: number;
  commercialIntentScore: number;
  confidence: number;
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));

export class RevenueSignalResolver {
  public async resolve(entityId: string): Promise<RevenueSignal> {
    const snapshot = await prisma.intelligenceSnapshot.findFirst({
      where: { entityId },
      orderBy: { generatedAt: 'desc' },
      select: {
        rankingScore: true,
        integrityScore: true,
        entityScore: true,
        attentionScore: true,
        revenueScore: true,
        confidence: true,
      },
    });

    if (!snapshot) {
      // No snapshot yet — use Post fields as fallback
      const post = await prisma.post.findUnique({
        where: { id: entityId },
        select: { rankingScore: true, attentionScore: true, commercialIntentScore: true, trustScore: true },
      });
      return {
        rankingScore: clamp((post?.rankingScore ?? 0) / 100),
        integrityScore: clamp((post?.trustScore ?? 50) / 100),
        authorityScore: 0,
        attentionScore: clamp((post?.attentionScore ?? 0) / 100),
        commercialIntentScore: clamp(post?.commercialIntentScore ?? 0),
        confidence: 0.5,
      };
    }

    return {
      rankingScore: clamp(snapshot.rankingScore),
      integrityScore: clamp(snapshot.integrityScore),
      authorityScore: clamp(snapshot.entityScore),
      attentionScore: clamp(snapshot.attentionScore),
      commercialIntentScore: clamp(snapshot.revenueScore),
      confidence: clamp(snapshot.confidence ?? 0.7),
    };
  }
}
