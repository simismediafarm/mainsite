import pino from 'pino';
import { SIMIS_QUEUE_NAMES } from '@simis/shared';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

/**
 * Worker-specific System Invariant Kernel (SIK) bootstrap.
 * Validates environment, database, and queue names at worker boot time.
 */
export async function bootstrapWorkerKernel() {
  logger.info('[SIK Worker] Bootstrapping Worker Invariant Kernel...');

  // 1. Env Invariant Check
  if (!process.env.DATABASE_URL) {
    logger.fatal('[Env Invariant Failure] Missing DATABASE_URL environment variable.');
    process.exit(1);
  }

  const hasRedis = process.env.REDIS_URL || (process.env.REDIS_HOST && process.env.REDIS_PORT);
  if (!hasRedis) {
    logger.fatal('[Env Invariant Failure] Missing Redis configuration.');
    process.exit(1);
  }

  // 2. DB Invariant Check
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
    throw new Error(`[DB Invariant Violation] Database connection protocol must be PostgreSQL. Got: "${dbUrl.split(':')[0]}"`);
  }
  if (dbUrl.includes('sqlite') || dbUrl.includes('file:')) {
    throw new Error('[DB Invariant Violation] SQLite or file-based DB configurations are strictly forbidden.');
  }

  // 3. Queue Invariant Check (intercept BullMQ Queue and Worker)
  const allowedQueues = Object.values(SIMIS_QUEUE_NAMES) as string[];
  try {
    const bullmq = require('bullmq');
    const OriginalQueue = bullmq.Queue;
    const OriginalWorker = bullmq.Worker;

    if (OriginalQueue) {
      Object.defineProperty(bullmq, 'Queue', {
        value: class extends OriginalQueue {
          constructor(name: string, ...args: any[]) {
            if (!allowedQueues.includes(name)) {
              throw new Error(`[Queue Invariant Violation] Unregistered queue name "${name}" used in worker initialization.`);
            }
            super(name, ...args);
          }
        },
        writable: true,
        configurable: true
      });
    }

    if (OriginalWorker) {
      Object.defineProperty(bullmq, 'Worker', {
        value: class extends OriginalWorker {
          constructor(name: string, ...args: any[]) {
            if (!allowedQueues.includes(name)) {
              throw new Error(`[Queue Invariant Violation] Unregistered worker queue name "${name}" used in worker initialization.`);
            }
            super(name, ...args);
          }
        },
        writable: true,
        configurable: true
      });
    }
  } catch (e) {
    logger.warn('[SIK Worker] BullMQ constructor hook skipped.');
  }

  logger.info('[SIK Worker] Worker Invariants Verified Successfully.');
}
export default bootstrapWorkerKernel;
