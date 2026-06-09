import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../../prisma';
import { QueueDispatcherService } from '../../services/admin/queue-dispatcher';

export const adminDlqRouter = new Hono();

// GET /admin/dlq — list failed EventQueueLog entries
adminDlqRouter.get('/', async (c) => {
  try {
    const limit = Math.min(Number(c.req.query('limit') ?? 50), 200);
    const items = await prisma.eventQueueLog.findMany({
      where: { status: 'FAILED' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        traceId: true,
        eventType: true,
        actor: true,
        source: true,
        createdAt: true,
        payload: true,
      },
    });
    return c.json({ items, total: items.length });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

const RetrySchema = z.object({ id: z.string().min(1) });

// POST /admin/dlq/retry — re-queue a failed event
adminDlqRouter.post('/retry', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = RetrySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Missing required field: id' }, 400);
  }

  try {
    const event = await prisma.eventQueueLog.findUnique({ where: { id: parsed.data.id } });
    if (!event) return c.json({ error: 'Event not found' }, 404);

    // Reset status to QUEUED and re-dispatch as a command
    await prisma.eventQueueLog.update({
      where: { id: parsed.data.id },
      data: { status: 'QUEUED' },
    });

    // Re-dispatch via authz queue if it was a command
    if (event.eventType === 'COMMAND.SUBMITTED' && event.payload) {
      await QueueDispatcherService.dispatchToAuthz(event.payload as any);
    }

    return c.json({ success: true, id: parsed.data.id, message: 'Event re-queued for processing.' });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});
