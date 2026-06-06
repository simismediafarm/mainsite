import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { QueueDispatcherService } from './queue-dispatcher';
import { SIMISCommand } from '@simis/shared';

const prisma = new PrismaClient();

export class BulkOperationService {
  static MAX_BATCH_SIZE = 1000;

  static async processBulkCommand(command: SIMISCommand, actor: string) {
    if (!command.scope || !Array.isArray((command.scope as any).ids)) {
      throw new Error('Bulk operations require an array of IDs in the scope.');
    }

    const ids = (command.scope as any).ids as string[];
    
    if (ids.length > this.MAX_BATCH_SIZE) {
      throw new Error(`Bulk operations exceed max batch size of ${this.MAX_BATCH_SIZE}`);
    }

    const correlationId = command.traceId || `trace_bulk_${uuidv4()}`;
    
    // Create the parent tracking event
    await prisma.eventQueueLog.create({
      data: {
        id: command.id || `cmd_${uuidv4()}`,
        traceId: correlationId,
        actor,
        source: command.source,
        eventType: command.type,
        payload: { ids, status: 'splitting' },
        status: 'PROCESSING'
      }
    });

    const jobs = [];

    // Fan-out individual commands
    for (const id of ids) {
      const childCommandId = `cmd_${uuidv4()}`;
      const childCommand: SIMISCommand = {
        id: childCommandId,
        traceId: `trace_child_${uuidv4()}`,
        timestamp: Date.now(),
        actor,
        source: 'web',
        type: command.type.replace('BULK.', '') as any, // e.g., CONTENT.BULK.REPROCESS -> CONTENT.REPROCESS
        scope: { targetId: id },
        mode: command.mode || 'execute',
        priority: 'standard'
      };

      await prisma.eventQueueLog.create({
        data: {
          id: childCommandId,
          traceId: childCommand.traceId,
          actor,
          source: childCommand.source,
          eventType: childCommand.type,
          payload: { ...childCommand.scope, correlationId },
          status: 'QUEUED'
        }
      });

      const jobId = await QueueDispatcherService.dispatchToAuthz(childCommand);
      jobs.push({ commandId: childCommandId, jobId });
    }

    // Update parent to COMPLETED
    await prisma.eventQueueLog.update({
      where: { id: command.id },
      data: { status: 'COMPLETED' }
    });

    return {
      correlationId,
      dispatchedCount: jobs.length,
      jobs
    };
  }
}
