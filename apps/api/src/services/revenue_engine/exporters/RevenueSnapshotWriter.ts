import { PrismaClient } from '@prisma/client';

export class RevenueSnapshotWriter {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async write(
    traceId: string,
    entityId: string,
    revenueScore: number,
    confidence: number
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.revenueSnapshot.create({
      data: {
        traceId,
        entityId,
        revenueScore,
        confidence,
        snapshotVersion: 1,
        snapshotDate: today,
        payload: {
          generatedBy: 'revenue-engine'
        }
      }
    });
  }
}
