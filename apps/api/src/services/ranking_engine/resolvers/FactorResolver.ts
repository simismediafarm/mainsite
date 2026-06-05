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

    // MOCK RAW DATA FETCHING FOR SIMIS OS CONTRACT
    // This is where we'd batch-query `Post`, `ContentMetric`, etc.
    const mockRawScores: Record<string, number> = {
      'authority': 75,
      'freshness': 12,
      'engagement': 450,
      'commercialIntent': 10
    };

    for (const meta of metadataRecords) {
      resolved.push({
        slug: meta.slug,
        rawValue: mockRawScores[meta.slug] || 0,
        metadata: {
          id: meta.id,
          slug: meta.slug,
          type: meta.type,
          minValue: meta.minValue,
          maxValue: meta.maxValue,
          defaultWeight: meta.defaultWeight,
          normalizationMethod: meta.normalizationMethod
        }
      });
    }

    return resolved;
  }
}
