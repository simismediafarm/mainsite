import { Worker, Job } from 'bullmq';
import { processEvent } from './queue/event.consumer';
import { processCommandJob } from './queue/command.consumer';
import { processAuthzJob } from './queue/authz.consumer';
import { SIMIS_QUEUE_NAMES } from '@simis/shared';
import { getRedisConfig } from '@simis/config';

import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const redisConfig = getRedisConfig();
const connection = 'url' in redisConfig
  ? { url: redisConfig.url }
  : { host: redisConfig.host, port: redisConfig.port, password: redisConfig.password };

logger.info({ queues: [SIMIS_QUEUE_NAMES.AI_ENRICHMENT, SIMIS_QUEUE_NAMES.AUTHZ, SIMIS_QUEUE_NAMES.COMMAND] }, 'SIMIS D-IOS: Worker Intelligence Kernel Booting');

// ── Worker 1: AI Enrichment (Legacy entity/attention/recommendation/demand) ──
export const enrichmentWorker = new Worker(
  SIMIS_QUEUE_NAMES.AI_ENRICHMENT,
  processEvent,
  {
    connection,
    removeOnComplete: { count: 1000 }, // prevent Redis memory exhaustion
    removeOnFail: { count: 500 },
  }
);

enrichmentWorker.on('completed', (job: Job) => {
  logger.info({ jobId: job.id }, '[AI_ENRICHMENT COMPLETED]');
});

enrichmentWorker.on('failed', (job: Job | undefined, err: Error) => {
  logger.error({ jobId: job?.id, err: err.message }, '[AI_ENRICHMENT FAILED]');
});

// ── Worker 2: Command Kernel (SIMISCommand operations from Control Tower) ──
export const commandWorker = new Worker(
  SIMIS_QUEUE_NAMES.COMMAND,
  processCommandJob,
  {
    connection,
    concurrency: 5,
    removeOnComplete: { count: 1000 }, // prevent Redis memory exhaustion
    removeOnFail: { count: 500 },
  }
);

commandWorker.on('completed', (job: Job) => {
  logger.info({ jobName: job.name, jobId: job.id }, '[COMMAND COMPLETED]');
});

commandWorker.on('failed', (job: Job | undefined, err: Error) => {
  logger.error({ jobId: job?.id, err: err.message }, '[COMMAND FAILED]');
});

// ── Worker 3: Zero Trust RBAC Decision Engine ─────────────────────────────────
export const authzWorker = new Worker(
  SIMIS_QUEUE_NAMES.AUTHZ,
  processAuthzJob,
  {
    connection,
    concurrency: 5,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 500 },
  }
);

authzWorker.on('completed', (job: Job) => {
  logger.info({ jobName: job.name, jobId: job.id }, '[AUTHZ COMPLETED]');
});

authzWorker.on('failed', (job: Job | undefined, err: Error) => {
  logger.error({ jobId: job?.id, err: err.message }, '[AUTHZ FAILED]');
});

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  logger.info('[Worker] Graceful shutdown: closing workers...');
  await enrichmentWorker.close();
  await authzWorker.close();
  await commandWorker.close();
  logger.info('[Worker] Workers closed. Exiting.');
  process.exit(0);
});
