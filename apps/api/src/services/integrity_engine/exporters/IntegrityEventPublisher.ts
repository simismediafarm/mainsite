import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class IntegrityEventPublisher {
  private prisma: PrismaClient;
  private readonly ENGINE_ID = 'integrity-engine';

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async publish(
    traceId: string,
    eventType: 'integrity.scored' | 'integrity.snapshot.created' | 'integrity.anomaly.detected',
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
        source: 'IntegrityEngine',
        payload
      }
    });
  }
}
