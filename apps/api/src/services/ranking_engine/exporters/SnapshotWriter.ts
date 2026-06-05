import { PrismaClient } from '@prisma/client';
import { ScoreExplanation } from '../core/ScoreExplainer';
import * as crypto from 'crypto';

export class SnapshotWriter {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Persist immutable RankingSnapshot. Insert only.
   */
  public async write(
    entityType: string,
    profileId: string,
    profileVersion: number,
    context: string,
    score: number,
    explanation: ScoreExplanation,
    rawFactorsForFingerprint: any[]
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Truncate to date for partitioning

    const factorFingerprint = crypto.createHash('sha256').update(JSON.stringify(rawFactorsForFingerprint)).digest('hex');
    const profileFingerprint = crypto.createHash('sha256').update(`${profileId}-v${profileVersion}`).digest('hex');

    await this.prisma.rankingSnapshot.create({
      data: {
        profileId,
        profileVersion,
        entityType,
        context,
        snapshotVersion: 2, // Upgraded version for hardening
        snapshotDate: today,
        payload: {
          traceId: explanation.traceId,
          score: score,
          explanation: explanation,
          factorFingerprint,
          profileFingerprint
        }
      }
    });
  }
}
