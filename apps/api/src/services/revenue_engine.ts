import { Post } from '@simis/shared';
import { prisma } from '../prisma';
import { eventBus } from './event_bus';

export class RevenueEngine {
  /**
   * Recalculates the RPM and CTR for a post
   * RPM formula: (totalRevenue / views) * 1000
   * CTR formula: clicks / impressions
   */
  public static recalculateMetrics(post: any): any {
    const views = Math.max(post.views, 1);
    const impressions = Math.max(post.impressions || (views * 2), 1);
    const clicks = post.clicks || 0;
    const totalRevenue = post.revenueTotal || 0;

    post.ctr = Number((clicks / impressions).toFixed(4));
    post.rpmReal = Number(((totalRevenue / views) * 1000).toFixed(2));
    post.cpmReal = Number(((totalRevenue / impressions) * 1000).toFixed(2));

    return post;
  }

  public static async recordImpression(postId: string, revenueAmount: number): Promise<any> {
    await prisma.adEvent.create({
      data: { postId, provider: 'System', type: 'impression', impression: true, click: false, conversion: false, revenueValue: revenueAmount }
    });

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return undefined;

    const updated = this.recalculateMetrics(post);
    
    const savedPost = await prisma.post.update({
      where: { id: postId },
      data: { status: post.status }
    });

    await prisma.eventQueueLog.create({
      data: {
        traceId: `trace_revenue_${postId}`,
        actor: 'system',
        source: 'revenue_engine',
        eventType: 'CONTENT.METRICS_UPDATE',
        payload: { id: postId, status: post.status },
        status: 'COMPLETED'
      }
    });
    
    eventBus.emitEvent({
      type: 'rpm_updated',
      payload: { id: post.id, rpmEstimate: updated.rpmReal, totalRevenue: updated.revenueTotal }
    });

    return savedPost;
  }

  public static async recordClick(postId: string): Promise<any> {
    const revenueValue = 0.15;
    await prisma.adEvent.create({
      data: { postId, provider: 'System', type: 'click', impression: false, click: true, conversion: false, revenueValue }
    });

    await prisma.post.update({
      where: { id: postId },
      data: { clicks: { increment: 1 }, revenueTotal: { increment: revenueValue } }
    });

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return undefined;

    const updated = this.recalculateMetrics(post);
    
    const savedPost = await prisma.post.update({
      where: { id: postId },
      data: { status: post.status }
    });

    await prisma.eventQueueLog.create({
      data: {
        traceId: `trace_revenue_${postId}`,
        actor: 'system',
        source: 'revenue_engine',
        eventType: 'CONTENT.METRICS_UPDATE',
        payload: { id: postId, status: post.status },
        status: 'COMPLETED'
      }
    });
    
    eventBus.emitEvent({
      type: 'rpm_updated',
      payload: { id: post.id, rpmEstimate: updated.rpmReal, ctr: updated.ctr, totalRevenue: updated.revenueTotal }
    });

    return savedPost;
  }
}
