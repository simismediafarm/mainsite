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

    // 3. Persist to EventQueueLog as COMMAND.SUBMITTED
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

    // 4. Dispatch to BullMQ Authz Queue
    const jobId = await QueueDispatcherService.dispatchToAuthz(command);
    
    // 5. Return traceId immediately
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
