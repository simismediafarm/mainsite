import { PrismaClient } from '@prisma/client';

export interface ResolvedProfile {
  id: string;
  name: string;
  version: number;
  schemaVersion: number;
  weights: any;
}

export class ProfileResolver {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Resolves the active ranking profile using priority chain:
   * Workspace Profile -> Context Profile -> Default Profile
   */
  public async resolve(contextName: string, workspaceId?: string): Promise<ResolvedProfile | null> {
    // Attempt 1: Workspace-specific profile
    if (workspaceId) {
      const workspaceProfile = await this.prisma.rankingProfile.findFirst({
        where: { name: contextName, workspaceId: workspaceId, isActive: true },
        orderBy: { version: 'desc' }
      });
      if (workspaceProfile) return this.mapProfile(workspaceProfile);
    }

    // Attempt 2: Global Context Profile
    const contextProfile = await this.prisma.rankingProfile.findFirst({
      where: { name: contextName, workspaceId: null, isActive: true },
      orderBy: { version: 'desc' }
    });
    if (contextProfile) return this.mapProfile(contextProfile);

    // Attempt 3: Global Default Profile
    const defaultProfile = await this.prisma.rankingProfile.findFirst({
      where: { name: 'default', workspaceId: null, isActive: true },
      orderBy: { version: 'desc' }
    });
    if (defaultProfile) return this.mapProfile(defaultProfile);

    return null; // No profile found
  }

  private mapProfile(profile: any): ResolvedProfile {
    return {
      id: profile.id,
      name: profile.name,
      version: profile.version,
      schemaVersion: profile.schemaVersion,
      weights: profile.weights
    };
  }
}
