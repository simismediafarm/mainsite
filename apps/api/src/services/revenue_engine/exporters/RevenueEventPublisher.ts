import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class RevenueEventPublisher {
  private prisma: PrismaClient;
  private readonly ENGINE_ID = 'revenue-engine';

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async publish(
    traceId: string,
    eventType: 'revenue.scored' | 'revenue.snapshot.created' | 'revenue.rule.executed' | 'revenue.anomaly.detected',
    status: 'success' | 'failed',
    payload: any,
    aggregateId: string,
    correlationId?: string,
    causationId?: string
  ): Promise<void> {
    await this.prisma.eventEnvelope.create({
      data: {
        eventId: uuidv4(),
        traceId,
        correlationId,
        causationId,
        aggregateId,
        aggregateType: 'Post',
        version: 1,
        engineId: this.ENGINE_ID,
        eventType,
        status,
        source: 'RevenueEngine',
        payload
      }
    });
  }
}
