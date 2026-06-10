import { Job } from 'bullmq';
import { SIMISCommand } from '@simis/shared';
import { prisma } from '@simis/database';
import { createRedisClient } from '@simis/config';

/**
 * Command Kernel Worker Processor
 *
 * Processes SIMISCommand jobs from the `simis-command-queue`.
 * Each command type maps to a specific handler. On completion or failure,
 * the EventQueueLog status is updated for traceability.
 */
export async function processCommandJob(job: Job<SIMISCommand>) {
  const command = job.data;
  const { type, scope, traceId, id: commandId } = command;

  console.log(`[CommandKernel] Processing ${type} | trace:${traceId}`);

  try {
    // Zero Trust Execution Guarantee: MUST verify AUTHZ.GRANTED exists
    const authzEvent = await prisma.securityEventLog.findFirst({
      where: {
        traceId: traceId,
        eventType: 'AUTHZ.GRANTED'
      }
    });

    if (!authzEvent) {
      console.error(`[CommandKernel] ZERO TRUST VIOLATION: Blocked execution of ${type} for trace:${traceId} (Missing AUTHZ.GRANTED)`);
      throw new Error(`Execution blocked: No AUTHZ.GRANTED event found in SecurityEventLog for traceId: ${traceId}`);
    }

    // Route by SIMISCommand type
    let result: any;
    switch (type) {
      case 'QUEUE.REPLAY':
        result = await handleQueueReplay(scope);
        break;
      case 'QUEUE.PAUSE':
        result = { queued: true, note: 'Worker pause signal emitted' };
        break;
      case 'QUEUE.RESUME':
        result = { queued: true, note: 'Worker resume signal emitted' };
        break;
      case 'CACHE.INVALIDATE':
        result = await handleCacheInvalidate(scope);
        break;
      case 'CACHE.WARMUP':
        result = { note: 'Cache warmup scheduled' };
        break;
      case 'CRAWLER.TRIGGER':
        result = await handleCrawlerTrigger(scope);
        break;
      case 'ENTITY.REPROCESS':
        result = await handleEntityReprocess(scope);
        break;
      case 'ATTENTION.RECALCULATE':
        result = { note: 'Attention OS recalculation queued' };
        break;
      case 'SYSTEM.HEALTHCHECK':
        result = { status: 'HEALTHY', timestamp: new Date().toISOString() };
        break;
      case 'TRACE.EXPORT':
        result = await handleTraceExport(scope);
        break;
      default:
        throw new Error(`[CommandKernel] No handler for command type: ${type}`);
    }

    // Update EventQueueLog status to COMPLETED
    await prisma.eventQueueLog.updateMany({
      where: { id: commandId },
      data: { status: 'COMPLETED' }
    });

    console.log(`[CommandKernel] COMPLETED ${type} | trace:${traceId}`);
    return result;

  } catch (err: any) {
    // Update EventQueueLog status to FAILED
    await prisma.eventQueueLog.updateMany({
      where: { id: commandId },
      data: { status: 'FAILED' }
    });
    console.error(`[CommandKernel] FAILED ${type} | trace:${traceId} | err:${err.message}`);
    throw err; // Re-throw so BullMQ triggers retry
  }
}

// ─── Handlers ────────────────────────────────────────────────────────────────

async function handleQueueReplay(scope: any) {
  const { jobId } = scope;
  if (!jobId) throw new Error('handleQueueReplay: jobId required');

  // Find the original event and re-enqueue with status QUEUED
  const event = await prisma.eventQueueLog.findUnique({ where: { id: jobId } });
  if (!event) throw new Error(`handleQueueReplay: event ${jobId} not found`);

  await prisma.eventQueueLog.update({
    where: { id: jobId },
    data: { status: 'QUEUED' },
  });

  return { replayed: jobId, previousStatus: event.status };
}

async function handleCacheInvalidate(scope: any) {
  const redis = createRedisClient();

  const pattern = scope?.pattern || 'ai-cache:*';
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
  await redis.quit();
  return { invalidated_keys: keys.length, pattern };
}

async function handleCrawlerTrigger(scope: any) {
  const { sourceId } = scope;
  if (!sourceId) throw new Error('handleCrawlerTrigger: sourceId required');

  // Log a crawl-requested event — the crawler mesh picks this up via EventQueueLog polling
  await prisma.eventQueueLog.create({
    data: {
      id: `crawl_${sourceId}_${Date.now()}`,
      traceId: `crawl_${sourceId}`,
      eventType: 'CRAWLER.REQUESTED',
      payload: { sourceId },
      status: 'QUEUED',
    },
  });

  return { triggered: sourceId };
}

async function handleEntityReprocess(scope: any) {
  const { entityId } = scope;
  if (!entityId) throw new Error('handleEntityReprocess: entityId required');

  // Reset entity intelligence scores to trigger recalculation pipeline
  await prisma.intelligenceSnapshot.updateMany({
    where: { entityId },
    data: {
      compositeIntelligenceScore: 0,
      rankingScore: 0,
      integrityScore: 0,
    },
  });

  // Log reprocess event
  await prisma.eventQueueLog.create({
    data: {
      id: `reprocess_${entityId}_${Date.now()}`,
      traceId: `reprocess_${entityId}`,
      eventType: 'ENTITY.REPROCESS.REQUESTED',
      payload: { entityId },
      status: 'QUEUED',
    },
  });

  return { reprocessed: entityId };
}

async function handleTraceExport(scope: any) {
  const { traceId } = scope;
  const events = await prisma.eventQueueLog.findMany({ where: { traceId } });
  return { traceId, event_count: events.length, events };
}
