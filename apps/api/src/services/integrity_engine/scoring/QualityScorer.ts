import { IntegritySignal } from '../signals/EngagementSignalResolver';

export class QualityScorer {
  /**
   * Calculates quality based on "Quality > Volume" principle.
   */
  public scoreEngagement(signals: IntegritySignal[]): number {
    const views = signals.find(s => s.type === 'views')?.rawValue || 1;
    const engagements = signals.find(s => s.type === 'engagements')?.rawValue || 0;
    
    // Example: Engagement rate logarithmically scaled
    const rate = Math.min(1, engagements / Math.max(1, views));
    return this.sigmoid(rate * 10 - 2); // Center around typical good engagement rates
  }

  public scoreSession(signals: IntegritySignal[]): number {
    const duration = signals.find(s => s.type === 'avgTimeOnPageSecs')?.rawValue || 0;
    const depth = signals.find(s => s.type === 'avgScrollDepthPct')?.rawValue || 0;

    // Quality: High duration + high scroll depth = Good
    const durationScore = Math.min(1, duration / 180); // 3 minutes is max quality
    const depthScore = Math.min(1, depth / 100);

    return (durationScore * 0.7) + (depthScore * 0.3);
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }
}
