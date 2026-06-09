import { TraceContext } from '../../shared/trace.context';
import { prisma } from '@simis/database';

export interface Candidate {
  postId: string;
  score: number;
}

export class RecommendationCandidateGenerator {
  async generate(userId: string, limit = 50, _context: TraceContext): Promise<Candidate[]> {
    // Fetch recent high-scoring snapshots as candidate pool
    const snapshots = await prisma.intelligenceSnapshot.findMany({
      orderBy: { compositeIntelligenceScore: 'desc' },
      take: limit,
      select: { entityId: true, compositeIntelligenceScore: true },
    });

    return snapshots.map(s => ({
      postId: s.entityId,
      score: Number(s.compositeIntelligenceScore),
    }));
  }
}
