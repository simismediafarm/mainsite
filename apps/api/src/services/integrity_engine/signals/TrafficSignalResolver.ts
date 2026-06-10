import { prisma } from '../../../prisma';
import { IntegritySignal } from './EngagementSignalResolver';

export class TrafficSignalResolver {
  public async resolve(entityId: string): Promise<IntegritySignal[]> {
    const post = await prisma.post.findUnique({
      where: { id: entityId },
      select: { views: true, createdAt: true },
    });

    if (!post) return [];

    const ageHours = Math.max(1, (Date.now() - post.createdAt.getTime()) / 3_600_000);
    const viewsPerHour = post.views / ageHours;

    return [
      { type: 'viewsPerHour', rawValue: Math.round(viewsPerHour * 100) / 100 },
      { type: 'totalViews', rawValue: post.views },
    ];
  }
}
