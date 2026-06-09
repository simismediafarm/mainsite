import { TraceContext } from '../../shared/trace.context';
import { prisma } from '@simis/database';

export interface DemandForecast {
  entityId: string;
  demandScore: number;
  trend: 'rising' | 'stable' | 'declining';
  confidence: number;
}

export class DemandForecastEngine {
  async forecast(entityIds: string[], context: TraceContext): Promise<DemandForecast[]> {
    const snapshots = await prisma.intelligenceSnapshot.findMany({
      where: { entityId: { in: entityIds } },
      orderBy: { createdAt: 'desc' },
      select: { entityId: true, demandScore: true, createdAt: true },
      take: entityIds.length * 5,
    });

    return entityIds.map(entityId => {
      const history = snapshots
        .filter(s => s.entityId === entityId)
        .map(s => Number(s.demandScore));

      const latest = history[0] ?? 0;
      const prev = history[1] ?? latest;
      const trend: DemandForecast['trend'] =
        latest > prev * 1.05 ? 'rising' : latest < prev * 0.95 ? 'declining' : 'stable';

      return {
        entityId,
        demandScore: Math.round(latest * 1000) / 1000,
        trend,
        confidence: history.length >= 3 ? 0.85 : 0.5,
      };
    });
  }
}
