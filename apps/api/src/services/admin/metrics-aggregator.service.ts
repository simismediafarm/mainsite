import { prisma } from '../../prisma';
import { SIMIS_QUEUE_NAMES } from '@simis/shared';

/**
 * MetricsAggregatorService
 *
 * Aggregates real-time system health metrics from:
 * - PostgreSQL EventQueueLog (queue depth per status)
 * - LLMCallLog (cost burn rate and fallback frequency)
 * - IntelligenceSnapshot (recent cache-hit effectiveness proxy)
 *
 * Implements a 5-second in-memory TTL cache to prevent connection pool exhaustion.
 */
export class MetricsAggregatorService {
  private cache: any = null;
  private lastFetched = 0;

  async getSystemHealth() {
    const now = Date.now();
    if (this.cache && now - this.lastFetched < 5000) {
      return this.cache;
    }

    const [queueMetrics, llmMetrics, recentEvents] = await Promise.all([
      this.getQueueDepth(),
      this.getLLMMetrics(),
      this.getRecentEventActivity(),
    ]);

    this.cache = {
      system_health_status: queueMetrics.failed > 10 ? 'DEGRADED' : 'OPTIMAL',
      queue_depth: queueMetrics,
      llm_cost_burn_rate: llmMetrics.estimatedCostPerHour,
      fallback_frequency: llmMetrics.fallbackRate,
      recent_event_throughput: recentEvents.count,
      queues: {
        command_queue: SIMIS_QUEUE_NAMES.COMMAND,
        enrichment_queue: SIMIS_QUEUE_NAMES.AI_ENRICHMENT,
      },
      last_updated: new Date().toISOString(),
    };
    this.lastFetched = now;

    return this.cache;
  }

  private async getQueueDepth() {
    const [queued, completed, failed] = await Promise.all([
      prisma.eventQueueLog.count({ where: { status: 'QUEUED' } }),
      prisma.eventQueueLog.count({ where: { status: 'COMPLETED' } }),
      prisma.eventQueueLog.count({ where: { status: 'FAILED' } }),
    ]);
    return { queued, completed, failed };
  }

  private async getLLMMetrics() {
    // Sum recent LLM costs in last 1 hour
    const oneHourAgo = new Date(Date.now() - 3600_000);
    const logs = await prisma.lLMCallLog.findMany({
      where: { createdAt: { gte: oneHourAgo } },
      select: { cost: true, status: true },
    });

    const totalCost = logs.reduce((sum, l) => {
      const costValue = typeof l.cost === 'number' ? l.cost : parseFloat(l.cost as any) || 0;
      return sum + costValue;
    }, 0);
    const fallbacks = logs.filter((l) => l.status === 'fallback').length;

    return {
      estimatedCostPerHour: Math.round(totalCost * 100) / 100,
      fallbackRate: logs.length > 0 ? fallbacks / logs.length : 0,
    };
  }

  private async getRecentEventActivity() {
    const fiveMinAgo = new Date(Date.now() - 300_000);
    const count = await prisma.eventQueueLog.count({
      where: { createdAt: { gte: fiveMinAgo } },
    });
    return { count };
  }
}
