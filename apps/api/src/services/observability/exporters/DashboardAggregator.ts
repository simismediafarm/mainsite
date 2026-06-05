export interface SystemHealth {
  ranking: number;
  integrity: number;
  revenue: number;
  overall: number;
}

export class DashboardAggregator {
  /**
   * Deterministic composition of system health across all OS pipelines.
   * 
   * Weights:
   * availability 30%
   * errorRate 25%
   * latency 20%
   * throughput 15%
   * anomalies 10%
   */
  public computeHealth(
    metrics: { availability: number, errorRate: number, p95LatencyMs: number, throughputHz: number, anomalyCount: number }
  ): number {
    const availabilityScore = metrics.availability; // 0.0 - 1.0
    const errorScore = Math.max(0, 1 - metrics.errorRate); // errorRate 0.0 - 1.0
    const latencyScore = Math.max(0, 1 - (metrics.p95LatencyMs / 1000)); // 1s is 0 score
    const throughputScore = Math.min(1, metrics.throughputHz / 100); // 100hz is perfect
    const anomalyScore = Math.max(0, 1 - (metrics.anomalyCount * 0.1)); // each anomaly drops 10%

    return (
      (availabilityScore * 0.30) +
      (errorScore * 0.25) +
      (latencyScore * 0.20) +
      (throughputScore * 0.15) +
      (anomalyScore * 0.10)
    );
  }

  public aggregate(rankingMetrics: any, integrityMetrics: any, revenueMetrics: any): SystemHealth {
    const rankingHealth = this.computeHealth(rankingMetrics);
    const integrityHealth = this.computeHealth(integrityMetrics);
    const revenueHealth = this.computeHealth(revenueMetrics);

    const overall = (rankingHealth * 0.4) + (integrityHealth * 0.3) + (revenueHealth * 0.3);

    return {
      ranking: rankingHealth,
      integrity: integrityHealth,
      revenue: revenueHealth,
      overall
    };
  }
}
