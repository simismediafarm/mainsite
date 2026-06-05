import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const adminTraceRouter = new Hono();

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
