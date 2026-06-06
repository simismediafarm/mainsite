import { SIMIS_QUEUE_NAMES } from '@simis/shared';

export function enforceQueueInvariant() {
  const allowedQueues = Object.values(SIMIS_QUEUE_NAMES) as string[];

  try {
    const bullmq = require('bullmq');

    const OriginalQueue = bullmq.Queue;
    const OriginalWorker = bullmq.Worker;

    if (OriginalQueue) {
      const GuardedQueue = class extends OriginalQueue {
        constructor(name: string, ...args: any[]) {
          if (!allowedQueues.includes(name)) {
            throw new Error(`[Queue Invariant Violation] Unregistered queue name "${name}" used in Queue initialization. Must be registered in SIMIS_QUEUE_NAMES.`);
          }
          super(name, ...args);
        }
      };
      
      Object.defineProperty(bullmq, 'Queue', {
        value: GuardedQueue,
        writable: true,
        configurable: true
      });
    }

    if (OriginalWorker) {
      const GuardedWorker = class extends OriginalWorker {
        constructor(name: string, ...args: any[]) {
          if (!allowedQueues.includes(name)) {
            throw new Error(`[Queue Invariant Violation] Unregistered queue name "${name}" used in Worker initialization. Must be registered in SIMIS_QUEUE_NAMES.`);
          }
          super(name, ...args);
        }
      };

      Object.defineProperty(bullmq, 'Worker', {
        value: GuardedWorker,
        writable: true,
        configurable: true
      });
    }

    console.log('[SIK Queue Guard] BullMQ Queue and Worker runtime enforcement attached.');
  } catch (e) {
    // BullMQ might not be installed in some environments (e.g. web workspace)
    console.warn('[SIK Queue Guard] BullMQ not found or patch failed. Skipping constructor hook.');
  }
}
