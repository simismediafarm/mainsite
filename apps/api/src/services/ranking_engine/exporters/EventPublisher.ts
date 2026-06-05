import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class EventPublisher {
  private prisma: PrismaClient;
  private readonly ENGINE_ID = 'ranking-engine';

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Publish EventEnvelope for observability and distributed tracing.
   */
  public async publish(
    traceId: string,
    eventType: 'ranking.profile.applied' | 'ranking.scored' | 'ranking.snapshot.created',
    status: 'success' | 'failed',
    payload: any,
    aggregateId?: string,
    correlationId?: string,
    causationId?: string
  ): Promise<void> {
    // Requires that EngineRegistry is seeded with this engine ID.
    // Ensure the engine exists or this write will fail on the FK constraint.
    
    await this.prisma.eventEnvelope.create({
      data: {
        eventId: uuidv4(),
        traceId,
        correlationId,
        causationId,
        aggregateId,
        aggregateType: aggregateId ? 'Post' : null, // Default mapping for SIMIS Ranking
        version: 1,
        engineId: this.ENGINE_ID,
        eventType,
        status,
        source: 'RankingArbitrationEngine',
        payload
      }
    });
  }
}
