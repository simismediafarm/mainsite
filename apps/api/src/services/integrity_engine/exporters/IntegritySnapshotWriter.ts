import { PrismaClient } from '@prisma/client';

export class IntegritySnapshotWriter {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async write(
    traceId: string,
    entityId: string,
    integrityScore: number
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.integritySnapshot.create({
      data: {
        traceId,
        entityId,
        integrityScore,
        snapshotVersion: 1,
        snapshotDate: today
      }
    });
  }
}
