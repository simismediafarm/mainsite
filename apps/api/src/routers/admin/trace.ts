import { Hono } from 'hono';
import { prisma } from '../../prisma';

export const adminTraceRouter = new Hono();

adminTraceRouter.get('/', async (c) => {
  try {
    const events = await prisma.eventQueueLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    return c.json({ events });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

adminTraceRouter.get('/:traceId', async (c) => {
  const traceId = c.req.param('traceId');

  // Fetch all events related to this traceId from EventQueueLog
  const events = await prisma.eventQueueLog.findMany({
    where: { traceId },
    orderBy: { createdAt: 'asc' }
  });

  if (!events || events.length === 0) {
    return c.json({ error: 'Trace not found' }, 404);
  }

  // Scaffold DAG reconstruction
  const dagNodes = events.map((e, index) => ({
    id: `node_${e.id}`,
    type: e.eventType,
    status: e.status,
    actor: e.actor,
    timestamp: e.createdAt,
    order: index
  }));

  return c.json({
    traceId,
    total_events: events.length,
    dag_reconstruction: dagNodes,
    raw_logs: events
  });
});
