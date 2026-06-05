import { Worker, Job } from 'bullmq';
import { processEvent } from './queue/event.consumer';
import { processCommandJob } from './queue/command.consumer';
import { processAuthzJob } from './queue/authz.consumer';
import { SIMIS_QUEUE_NAMES } from '@simis/shared';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
};

console.log('🚀 SIMIS D-IOS: Worker Intelligence Kernel Booting...');
console.log(`   Listening on queues: [${SIMIS_QUEUE_NAMES.AI_ENRICHMENT}] [simis-authz-queue] [${SIMIS_QUEUE_NAMES.COMMAND}]`);

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
  console.log(`[AI_ENRICHMENT COMPLETED] ${job.id}`);
});

enrichmentWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`[AI_ENRICHMENT FAILED] ${job?.id}: ${err.message}`);
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
  console.log(`[COMMAND COMPLETED] ${job.name} | ${job.id}`);
});

commandWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`[COMMAND FAILED] ${job?.id}: ${err.message}`);
});

// ── Worker 3: Zero Trust RBAC Decision Engine ─────────────────────────────────
export const authzWorker = new Worker(
  'simis-authz-queue',
  processAuthzJob,
  {
    connection,
    concurrency: 5,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 500 },
  }
);

authzWorker.on('completed', (job: Job) => {
  console.log(`[AUTHZ COMPLETED] ${job.name} | ${job.id}`);
});

authzWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`[AUTHZ FAILED] ${job?.id}: ${err.message}`);
});

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('[Worker] Graceful shutdown: closing workers...');
  await enrichmentWorker.close();
  await authzWorker.close();
  await commandWorker.close();
  console.log('[Worker] Workers closed. Exiting.');
  process.exit(0);
});
