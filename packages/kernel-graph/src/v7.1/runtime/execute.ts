// packages/kernel-graph/src/v7.1/runtime/execute.ts
/**
 * execute.ts — DECT-enforced execution entrypoint.
 *
 * This file is now a thin adapter.  All execution logic has been moved to
 * `execution_pipeline.ts`.  Direct calls to `executeTransaction`, `IOBuffer`,
 * or the scheduler are FORBIDDEN here.
 *
 * Old execution path (pre-v7.3):
 *   validateSyscall → runShadowCheck → executeTransaction → traceHash
 *
 * New execution path (v7.3+):
 *   execution_pipeline.runExecutionPipeline (single gated path)
 */

import { runExecutionPipeline, PipelineIntent } from './execution_pipeline';
import { DLQManager, FailureClassification } from '../recovery/dlq';

/** KernelIntent — shape expected by the legacy scheduler and syscall router. */
export interface KernelIntent {
  intent_id: string;
  syscall_name: string;
  payload: Record<string, any>;
  idempotency_key: string;
  priority: number;
  status: string;
}

/**
 * Primary execution entry-point.
 *
 * Converts a `KernelIntent` to a `PipelineIntent` and delegates to the
 * single deterministic execution pipeline.  Any DECT violation, GDG violation,
 * or closure mismatch throws immediately — errors are caught and routed to DLQ.
 */
export async function executeIntent(intent: KernelIntent): Promise<any> {
  console.log(`[EXECUTE] Routing intent ${intent.intent_id} → execution_pipeline`);

  const pipelineIntent: PipelineIntent = {
    intent_id: intent.intent_id,
    syscall_name: intent.syscall_name,
    payload: intent.payload,
    idempotency_key: intent.idempotency_key,
    priority: intent.priority,
    // Graph structure is optional — symbolic simulator handles missing graph gracefully
    graph: (intent.payload as any)?.graph,
  };

  try {
    const result = await runExecutionPipeline(pipelineIntent);
    console.log(`[EXECUTE] Intent ${intent.intent_id} completed — hash: ${result.execution_hash}`);
    return { status: result.status, traceHash: result.execution_hash, poe: result.poe };
  } catch (error: any) {
    console.error(`[EXECUTE] Intent ${intent.intent_id} failed:`, error.message);
    await DLQManager.handleFailure(intent, error, classifyError(error));
    return { status: 'FAILED', reason: error.message };
  }
}

function classifyError(error: Error): FailureClassification {
  const msg = error.message;
  if (msg.includes('[DECT:') || msg.includes('GDG') || msg.includes('CLOSURE')) {
    return FailureClassification.REJECTED; // hard formal violation — do NOT retry
  }
  if (msg.includes('lock') || msg.includes('timeout')) {
    return FailureClassification.RETRYABLE;
  }
  return FailureClassification.ESCALATE;
}
