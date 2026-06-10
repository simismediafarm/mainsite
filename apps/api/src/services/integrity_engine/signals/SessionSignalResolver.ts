import { prisma } from '../../../prisma';
import { IntegritySignal } from './EngagementSignalResolver';

export class SessionSignalResolver {
  public async resolve(entityId: string): Promise<IntegritySignal[]> {
    const metric = await prisma.contentMetric.findUnique({
      where: { postId: entityId },
    });

    if (!metric) return [];

    return [
      { type: 'avgTimeOnPageSecs', rawValue: metric.timeOnPageAvg },
      { type: 'avgScrollDepthPct', rawValue: metric.sessionDepthAvg },
      { type: 'bounceRate', rawValue: metric.bounceRate },
      { type: 'returningUsers', rawValue: metric.returningUsers },
    ];
  }
}
