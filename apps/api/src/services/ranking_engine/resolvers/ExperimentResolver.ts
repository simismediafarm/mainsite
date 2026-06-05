import { PrismaClient } from '@prisma/client';

export interface ResolvedExperiment {
  experimentId?: string;
  profileId: string;
  variant: 'control' | 'variant';
}

export class ExperimentResolver {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Resolves A/B testing splits deterministically using hashing.
   */
  public async resolve(baseProfileId: string, targetId: string): Promise<ResolvedExperiment> {
    const experiment = await this.prisma.rankingExperiment.findFirst({
      where: {
        status: 'running',
        controlProfileId: baseProfileId
      }
    });

    if (!experiment) {
      return {
        profileId: baseProfileId,
        variant: 'control'
      };
    }

    // Deterministic hashing: simple hash string targetId
    const hash = this.stringToHash(targetId);
    const bucket = Math.abs(hash) % 100;

    if (bucket < experiment.trafficPercentage) {
      return {
        experimentId: experiment.id,
        profileId: experiment.variantProfileId,
        variant: 'variant'
      };
    }

    return {
      experimentId: experiment.id,
      profileId: experiment.controlProfileId,
      variant: 'control'
    };
  }

  private stringToHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }
}
