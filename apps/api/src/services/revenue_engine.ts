import { Post } from '@simis/shared';
import { db } from '../store/sqlite_db';

export class RevenueEngine {
  /**
   * Recalculates the RPM and CTR for a post
   * RPM formula: (totalRevenue / views) * 1000
   * CTR formula: clicks / impressions
   */
  public static recalculateMetrics(post: any): any {
    const views = Math.max(post.views, 1); // Avoid division by zero
    // We will estimate impressions from the db or just use a derived metric
    // In SQLite we don't store aggregate impressions on the post natively, but we could fetch it.
    // For now we assume we fetched it or we calculate it. 
    // Actually, let's keep the calculation simple. If impressions is missing, we use views * 2 as a proxy.
    const impressions = Math.max(post.impressions || (views * 2), 1);
    
    const clicks = post.clicks || 0;
    const totalRevenue = post.revenueTotal || 0;

    post.ctr = Number((clicks / impressions).toFixed(4));
    post.rpmReal = Number(((totalRevenue / views) * 1000).toFixed(2));
    
    post.cpmReal = Number(((totalRevenue / impressions) * 1000).toFixed(2));

    return post;
  }

  /**
   * Simulates recording an impression with an associated revenue amount
   */
  public static async recordImpression(postId: string, revenueAmount: number): Promise<any> {
    await db.recordAdEvent(postId, 'System', 'impression', revenueAmount);
    const post = await db.getPost(postId);
    if (!post) return undefined;

    const updated = this.recalculateMetrics(post);
    // Persist calculated metrics
    const savedPost = await db.transitionPostState(postId, post.status as any);
    
    db.emitEvent({
      type: 'rpm_updated',
      payload: { id: post.id, rpmEstimate: updated.rpmReal, totalRevenue: updated.revenueTotal }
    });

    return savedPost;
  }

  /**
   * Simulates recording a click
   */
  public static async recordClick(postId: string): Promise<any> {
    await db.recordAdEvent(postId, 'System', 'click', 0.15); // 15 cents per click simulation
    const post = await db.getPost(postId);
    if (!post) return undefined;

    const updated = this.recalculateMetrics(post);
    const savedPost = await db.transitionPostState(postId, post.status as any);
    
    db.emitEvent({
      type: 'rpm_updated',
      payload: { id: post.id, rpmEstimate: updated.rpmReal, ctr: updated.ctr, totalRevenue: updated.revenueTotal }
    });

    return savedPost;
  }
}
