import { PrismaClient } from '@prisma/client';
import { FactorMetadata } from '../core/FactorNormalizer';

export interface ResolvedFactor {
  slug: string;
  rawValue: number;
  metadata: FactorMetadata;
}

export class FactorResolver {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Fetches raw signals. No normalization. No weighting.
   * In a real implementation, this would fetch from Post, IntegritySignal, EntityNode, etc.
   */
  public async resolveFactors(entityId: string, entityType: string, activeFactorSlugs: string[]): Promise<ResolvedFactor[]> {
    // Memoization/Caching for factor metadata is highly recommended here to avoid DB hits on every resolve.
    const metadataRecords = await this.prisma.rankingFactor.findMany({
      where: {
        slug: { in: activeFactorSlugs },
        isActive: true
      }
    });

    const resolved: ResolvedFactor[] = [];

    // Batch-fetch post metrics for real signal data
    const post = await this.prisma.post.findUnique({
      where: { id: entityId },
      select: {
        trustScore: true,
        views: true,
        likes: true,
        clicks: true,
        rankingScore: true,
        attentionScore: true,
        commercialIntentScore: true,
        createdAt: true,
      },
    });

    const ageHours = post
      ? (Date.now() - post.createdAt.getTime()) / 3_600_000
      : 0;

    const liveScores: Record<string, number> = {
      authority: post?.trustScore ?? 0,
      freshness: post ? Math.max(0, 168 - ageHours) : 0, // decay over 168h
      engagement: post ? post.views + post.likes + post.clicks : 0,
      commercialIntent: post?.commercialIntentScore ?? 0,
      ranking: post?.rankingScore ?? 0,
      attention: post?.attentionScore ?? 0,
    };

    for (const meta of metadataRecords) {
      resolved.push({
        slug: meta.slug,
        rawValue: liveScores[meta.slug] ?? 0,
        metadata: {
          id: meta.id,
          slug: meta.slug,
          type: meta.type,
          minValue: meta.minValue,
          maxValue: meta.maxValue,
          defaultWeight: meta.defaultWeight,
          normalizationMethod: meta.normalizationMethod,
        },
      });
    }

    return resolved;
  }
}
