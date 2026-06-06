import { Job, Queue } from 'bullmq';
import { SIMISCommand, SIMIS_QUEUE_NAMES } from '@simis/shared';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const commandQueue = new Queue<SIMISCommand>(SIMIS_QUEUE_NAMES.COMMAND, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD
  }
});

// Deterministic Policy Engine Matrix
const POLICY_MATRIX: Record<string, string[]> = {
  visitor: ["SYSTEM.HEALTHCHECK"],
  contributor: ["CONTENT.DRAFT.CREATE"],
  author: ["CONTENT.DRAFT.CREATE", "CONTENT.EDIT.OWN", "CONTENT.PUBLISH.REQUEST", "AFFILIATE.LINK.ADD"],
  editor: ["CONTENT.REVIEW", "CONTENT.APPROVE", "CONTENT.REJECT", "CONTENT.EDIT.ANY", "CACHE.WARMUP", "TRACE.EXPORT"],
  publisher: ["CONTENT.PUBLISH", "CONTENT.SCHEDULE", "DISTRIBUTION.TRIGGER", "CRAWLER.TRIGGER", "SYSTEM.HEALTHCHECK"],
  admin: ["*"] // Wildcard for all commands
};

export async function processAuthzJob(job: Job<SIMISCommand>) {
  const command = job.data;
  const { type, traceId, actor, source, actorContext } = command;

  console.log(`[RBACAuthz] Evaluating ${type} for actor: ${actor} | trace: ${traceId}`);

  try {
    // 1. Emit AUTHZ.REQUESTED
    await emitSecurityEvent(traceId, actor, source, 'AUTHZ.REQUESTED', command);

    // 2. Resolve Role
    const role = resolveRoleDeterministic(actor, source, actorContext);
    
    // 3. Evaluate Policy
    await emitSecurityEvent(traceId, actor, source, 'AUTHZ.EVALUATED', { role, commandType: type });
    const isGranted = evaluatePolicy(role, type);

    // 4. Emit Decision
    if (isGranted) {
      await emitSecurityEvent(traceId, actor, source, 'AUTHZ.GRANTED', { role, commandType: type, reason: 'Matched policy matrix' });
      
      // 5. Forward to Execution Queue
      await commandQueue.add(`simis-command-${type}`, command, {
        jobId: command.id,
        priority: 2,
        attempts: 3
      });

      console.log(`[RBACAuthz] GRANTED ${type} for ${actor}`);
    } else {
      await emitSecurityEvent(traceId, actor, source, 'AUTHZ.DENIED', { role, commandType: type, reason: 'Role unauthorized for command type' });
      
      // Update the raw EventQueueLog to show failure/blocked
      await prisma.eventQueueLog.updateMany({
        where: { id: command.id },
        data: { status: 'BLOCKED_BY_RBAC' }
      });
      
      console.warn(`[RBACAuthz] DENIED ${type} for ${actor}`);
    }

    return { granted: isGranted, role };

  } catch (err: any) {
    console.error(`[RBACAuthz] ERROR evaluating ${type} | trace: ${traceId} | err: ${err.message}`);
    await emitSecurityEvent(traceId, actor, source, 'AUTHZ.DENIED', { error: err.message });
    throw err;
  }
}

// Helpers

function resolveRoleDeterministic(actor: string, source: string, actorContext?: any): string {
  // In a real implementation, this checks verified token scopes or app_metadata cache.
  // For the simulation / v3.3 blueprint:
  if (source === 'cli' && actor === 'simis_cli_admin') return 'admin';
  if (actor === 'mock_editor') return 'editor';
  if (actor === 'mock_author') return 'author';
  
  // Default fallback
  return 'visitor';
}

function evaluatePolicy(role: string, commandType: string): boolean {
  if (role === 'admin') return true;
  const allowedCommands = POLICY_MATRIX[role] || [];
  return allowedCommands.includes(commandType);
}

async function emitSecurityEvent(traceId: string, actor: string, source: string, eventType: string, payload: any) {
  // await prisma.securityEventLog.create({
  //   data: {
  //     traceId,
  //     actor,
  //     source,
  //     eventType,
  //     payload,
  //     timestamp: Date.now()
  //   }
  // });
  console.log(`[SecurityEvent] ${eventType}`, payload);
}
