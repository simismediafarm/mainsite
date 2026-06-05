import { Hono } from 'hono';
import { MetricsAggregatorService } from '../../services/admin/metrics-aggregator.service';

export const adminMetricsRouter = new Hono();
const metricsService = new MetricsAggregatorService();

adminMetricsRouter.get('/', async (c) => {
  try {
    const metrics = await metricsService.getSystemHealth();
    return c.json(metrics);
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch metrics', details: err.message }, 500);
  }
});
