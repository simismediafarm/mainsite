import { prisma } from '../../prisma';

export interface OSLayerMetrics {
  layer: string;
  activeEntities: number;
  snapshotCount: number;
  avgCompositeScore: number;
  lastActivityAt: string | null;
}

export interface OSLayerReport {
  layers: OSLayerMetrics[];
  totalSnapshots: number;
  systemCompositeScore: number;
  generatedAt: string;
}

const OS_LAYERS = ['demand', 'recommendation', 'entity', 'attention', 'integrity', 'ranking', 'revenue'] as const;

export class OSLayerAggregatorService {
  async aggregate(): Promise<OSLayerReport> {
    const [snapshots, latestByLayer] = await Promise.all([
      prisma.intelligenceSnapshot.aggregate({
        _count: { id: true },
        _avg: { compositeIntelligenceScore: true },
      }),
      // Get latest snapshot per task type as proxy for per-layer activity
      prisma.intelligenceSnapshot.findMany({
        distinct: ['taskType'],
        orderBy: { createdAt: 'desc' },
        select: {
          taskType: true,
          createdAt: true,
          compositeIntelligenceScore: true,
        },
        take: 20,
      }),
    ]);

    const layers: OSLayerMetrics[] = OS_LAYERS.map(layer => {
      const match = latestByLayer.find((s: { taskType: string | null; createdAt: Date; compositeIntelligenceScore: number | null }) => s.taskType?.includes(layer));
      return {
        layer,
        activeEntities: 0,
        snapshotCount: latestByLayer.filter((s: { taskType: string | null }) => s.taskType?.includes(layer)).length,
        avgCompositeScore: match?.compositeIntelligenceScore
          ? Math.round(Number(match.compositeIntelligenceScore) * 1000) / 1000
          : 0,
        lastActivityAt: match?.createdAt?.toISOString() ?? null,
      };
    });

    return {
      layers,
      totalSnapshots: snapshots._count.id,
      systemCompositeScore:
        Math.round((snapshots._avg.compositeIntelligenceScore ?? 0) * 1000) / 1000,
      generatedAt: new Date().toISOString(),
    };
  }
}
