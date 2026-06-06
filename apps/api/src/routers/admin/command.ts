import { Hono } from 'hono';
import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { SIMISCommandInputSchema, SIMISCommand } from '@simis/shared';
import { QueueDispatcherService } from '../../services/admin/queue-dispatcher';

const prisma = new PrismaClient();
export const adminCommandRouter = new Hono();

adminCommandRouter.post('/', async (c) => {
  try {
    const rawBody = await c.req.json();
    
    // 1. Validate with Zod
    const validationResult = SIMISCommandInputSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return c.json({ error: 'Invalid command schema', details: validationResult.error.format() }, 400);
    }

    const commandInput = validationResult.data;

    // 2. Assign traceId if missing, and populate default SIMISCommand fields
    const traceId = commandInput.traceId || `trace_${uuidv4()}`;
    const timestamp = commandInput.timestamp || Date.now();
    const commandId = commandInput.id || `cmd_${uuidv4()}`;

    const command: SIMISCommand = {
      ...commandInput,
      id: commandId,
      traceId,
      timestamp,
      priority: commandInput.priority || 'standard',
    };

    // 3. Handle Bulk Operations explicitly
    if (command.type.includes('BULK.')) {
      const { BulkOperationService } = await import('../../services/admin/bulk-operation.service');
      const result = await BulkOperationService.processBulkCommand(command, command.actor || 'admin');
      return c.json({
        status: 'PENDING_BULK_AUTHZ',
        message: 'Bulk command split and submitted for authorization evaluation',
        ...result
      }, 202);
    }

    // 4. Persist to EventQueueLog as COMMAND.SUBMITTED
    await prisma.eventQueueLog.create({
      data: {
        id: commandId,
        traceId: traceId,
        actor: command.actor,
        source: command.source,
        eventType: 'COMMAND.SUBMITTED',
        payload: command as unknown as Prisma.InputJsonValue,
        mode: command.mode,
        status: 'QUEUED'
      }
    });

    // 5. Dispatch to BullMQ Authz Queue
    const jobId = await QueueDispatcherService.dispatchToAuthz(command);
    
    // 6. Return traceId immediately
    return c.json({
      status: 'PENDING_AUTHZ',
      message: 'Command submitted for authorization evaluation',
      commandId,
      traceId,
      jobId
    }, 202);

  } catch (error: any) {
    console.error('Command routing error:', error);
    return c.json({ error: 'Internal server error', details: error.message }, 500);
  }
});

// 6. POST /entity/reprocess
adminCommandRouter.post('/entity/reprocess', async (c) => {
  try {
    const rawBody = await c.req.json().catch(() => ({}));
    const user = (c as any).get('user');
    const actor = user?.email || 'admin';
    const traceId = `trace_${uuidv4()}`;
    const commandId = `cmd_${uuidv4()}`;

    await prisma.controlAudit.create({
      data: {
        actor,
        action: 'ENTITY.REPROCESS',
        target: rawBody.entityId || 'all',
        status: 'SUCCESS',
        payload: rawBody
      }
    });

    await prisma.eventQueueLog.create({
      data: {
        id: commandId,
        traceId,
        actor,
        source: 'dashboard',
        eventType: 'ENTITY.REPROCESS',
        payload: rawBody,
        status: 'QUEUED'
      }
    });

    return c.json({ success: true, commandId, traceId, message: 'Entity reprocessing event submitted' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 7. POST /crawler/trigger
adminCommandRouter.post('/crawler/trigger', async (c) => {
  try {
    const rawBody = await c.req.json().catch(() => ({}));
    const user = (c as any).get('user');
    const actor = user?.email || 'admin';
    const traceId = `trace_${uuidv4()}`;
    const commandId = `cmd_${uuidv4()}`;

    await prisma.controlAudit.create({
      data: {
        actor,
        action: 'CRAWLER.TRIGGER',
        target: rawBody.sourceUrl || 'all',
        status: 'SUCCESS',
        payload: rawBody
      }
    });

    await prisma.eventQueueLog.create({
      data: {
        id: commandId,
        traceId,
        actor,
        source: 'dashboard',
        eventType: 'CRAWLER.TRIGGER',
        payload: rawBody,
        status: 'QUEUED'
      }
    });

    return c.json({ success: true, commandId, traceId, message: 'Crawler trigger event submitted' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 8. POST /cache/invalidate
adminCommandRouter.post('/cache/invalidate', async (c) => {
  try {
    const rawBody = await c.req.json().catch(() => ({}));
    const user = (c as any).get('user');
    const actor = user?.email || 'admin';
    const traceId = `trace_${uuidv4()}`;
    const commandId = `cmd_${uuidv4()}`;

    await prisma.controlAudit.create({
      data: {
        actor,
        action: 'CACHE.INVALIDATE',
        target: rawBody.key || 'all',
        status: 'SUCCESS',
        payload: rawBody
      }
    });

    await prisma.eventQueueLog.create({
      data: {
        id: commandId,
        traceId,
        actor,
        source: 'dashboard',
        eventType: 'CACHE.INVALIDATE',
        payload: rawBody,
        status: 'QUEUED'
      }
    });

    return c.json({ success: true, commandId, traceId, message: 'Cache invalidation event submitted' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// 9. POST /system/mode
adminCommandRouter.post('/system/mode', async (c) => {
  try {
    const rawBody = await c.req.json().catch(() => ({}));
    const mode = rawBody.mode;
    if (mode !== 'dry-run' && mode !== 'execute') {
      return c.json({ error: 'Invalid mode. Use "dry-run" or "execute"' }, 400);
    }
    const user = (c as any).get('user');
    const actor = user?.email || 'admin';
    const traceId = `trace_${uuidv4()}`;

    const existing = await prisma.systemConfiguration.findFirst({
      where: { key: 'global_execution_mode', environment: 'production' }
    });

    if (existing) {
      await prisma.systemConfiguration.update({
        where: { id: existing.id },
        data: { value: { mode } }
      });
    } else {
      await prisma.systemConfiguration.create({
        data: {
          key: 'global_execution_mode',
          value: { mode },
          scope: 'global',
          environment: 'production'
        }
      });
    }

    await prisma.controlAudit.create({
      data: {
        actor,
        action: 'SYSTEM.MODE_CHANGE',
        target: 'global_execution_mode',
        status: 'SUCCESS',
        payload: { mode }
      }
    });

    return c.json({ success: true, mode, traceId, message: `System execution mode updated to ${mode}` });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

