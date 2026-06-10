import { prisma } from '../../../prisma';

export interface IntegritySignal {
  type: string;
  rawValue: number;
  metadata?: any;
}

export class EngagementSignalResolver {
  public async resolve(entityId: string): Promise<IntegritySignal[]> {
    const post = await prisma.post.findUnique({
      where: { id: entityId },
      select: { views: true, likes: true, clicks: true, ctr: true, metrics: true },
    });

    if (!post) return [];

    return [
      { type: 'views', rawValue: post.views },
      { type: 'engagements', rawValue: post.likes + post.clicks },
      { type: 'comments', rawValue: 0 }, // no comments model yet
      { type: 'shares', rawValue: post.clicks },
      { type: 'ctr', rawValue: post.ctr },
      { type: 'bounceRate', rawValue: post.metrics?.bounceRate ?? 0 },
      { type: 'returningUsers', rawValue: post.metrics?.returningUsers ?? 0 },
    ];
  }
}
