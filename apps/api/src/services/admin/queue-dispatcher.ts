import { Queue } from 'bullmq';
import { SIMISCommand, SIMIS_QUEUE_NAMES } from '@simis/shared';

export const commandQueue = new Queue<SIMISCommand>(SIMIS_QUEUE_NAMES.COMMAND, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD
  }
});

// Create Authz Queue for RBAC evaluation
export const authzQueue = new Queue<SIMISCommand>('simis-authz-queue', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD
  }
});

export class QueueDispatcherService {
  /**
   * Dispatch a validated SIMISCommand to the BullMQ processing pipeline.
   */
  static async dispatch(command: SIMISCommand): Promise<string> {
    const jobName = `simis-command-${command.type}`;
    
    // Add command to BullMQ with priority mapping
    const job = await commandQueue.add(jobName, command, {
      jobId: command.id, // Enforce uniqueness and correlation
      priority: this.mapPriority(command.priority),
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      }
    });

    return job.id as string;
  }

  /**
   * Dispatch a validated SIMISCommand to the Authz processing pipeline.
   */
  static async dispatchToAuthz(command: SIMISCommand): Promise<string> {
    const jobName = `simis-authz-${command.type}`;
    
    // Add command to BullMQ with priority mapping
    const job = await authzQueue.add(jobName, command, {
      jobId: command.id, // Enforce uniqueness and correlation
      priority: this.mapPriority(command.priority),
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      }
    });

    return job.id as string;
  }

  private static mapPriority(priority: string): number {
    switch (priority) {
      case 'critical': return 1;
      case 'standard': return 2;
      case 'low': return 3;
      default: return 2;
    }
  }
}
