import { PrismaClient } from '@prisma/client';

export interface EventLineage {
  rankingEvents: any[];
  integrityEvents: any[];
  revenueEvents: any[];
  anomalies: any[];
  snapshots: {
    ranking: any | null;
    integrity: any | null;
    revenue: any | null;
  };
}

export class TraceExplorer {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Reconstructs the entire decision path across all OS layers using a single traceId.
   */
  public async explore(traceId: string): Promise<EventLineage> {
    const events = await this.prisma.eventEnvelope.findMany({
      where: { traceId },
      orderBy: { timestamp: 'asc' }
    });

    const rankingEvents = events.filter(e => e.source === 'RankingArbitrationEngine');
    const integrityEvents = events.filter(e => e.source === 'IntegrityEngine');
    const revenueEvents = events.filter(e => e.source === 'RevenueEngine');
    const anomalies = events.filter(e => e.eventType.includes('anomaly'));

    const rankingSnapshot = await this.prisma.rankingSnapshot.findFirst({ where: { payload: { equals: traceId, path: ['traceId'] } } });
    const integritySnapshot = await this.prisma.integritySnapshot.findFirst({ where: { traceId } });
    const revenueSnapshot = await this.prisma.revenueSnapshot.findFirst({ where: { traceId } });

    return {
      rankingEvents,
      integrityEvents,
      revenueEvents,
      anomalies,
      snapshots: {
        ranking: rankingSnapshot,
        integrity: integritySnapshot,
        revenue: revenueSnapshot
      }
    };
  }
}
