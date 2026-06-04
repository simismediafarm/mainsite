/**
 * poe_guard.ts — Runtime Proof-of-Execution Hash Guard
 *
 * PRODUCTION HARDENING: Enforces determinism at runtime.
 *
 * If live execution hash diverges from replay hash, the system:
 *   1. Freezes the IOBuffer (no further writes)
 *   2. Halts the pipeline
 *   3. Throws a NON_DETERMINISTIC_EXECUTION error
 *
 * This guard MUST be called:
 *   - After every pipeline execution
 *   - Before any publish/commit step in the decision layer
 */

import crypto from 'crypto';
// @ts-ignore
import { IOBuffer } from '@simis/kernel-graph/dist/v7.2.1/ecvm/io_buffer';
// @ts-ignore
import { PipelineResult } from '@simis/kernel-graph/dist/v7.1/runtime/execution_pipeline';

// Tracks frozen IOBuffers to prevent further writes after a guard violation
const frozenBuffers = new WeakSet<IOBuffer>();

/**
 * Checks if two execution hashes are identical.
 * Called after replay to validate determinism.
 *
 * @throws {Error} NON_DETERMINISTIC_EXECUTION if hashes diverge
 */
export function assertDeterministicReplay(
  liveResult: PipelineResult,
  replayResult: PipelineResult,
  ioBuffer?: IOBuffer,
): void {
  const liveHash = liveResult.execution_hash;
  const replayHash = replayResult.execution_hash;

  if (liveHash !== replayHash) {
    // Step 1: Freeze IOBuffer if provided
    if (ioBuffer) {
      frozenBuffers.add(ioBuffer);
    }

    // Step 2: Emit structured alert
    console.error('[POE GUARD] ⚠️  NON-DETERMINISTIC EXECUTION DETECTED', {
      intent_id: liveResult.intent_id,
      live_hash: liveHash,
      replay_hash: replayHash,
    });

    // Step 3: Hard halt — throw before any commit can proceed
    throw new Error(
      `NON_DETERMINISTIC_EXECUTION: intent ${liveResult.intent_id} — ` +
      `live hash ${liveHash} !== replay hash ${replayHash}. ` +
      `Pipeline halted. IOBuffer frozen.`
    );
  }
}

/**
 * Validates a PoE closure_proof against its expected lean proof hash.
 * Called by the execution pipeline after Step 8 (PoE generation).
 *
 * @throws {Error} POE_CLOSURE_MISMATCH if hashes diverge
 */
export function assertPoEIntegrity(
  closureProof: string,
  expectedLeanHash: string,
  intentId: string,
): void {
  if (closureProof !== expectedLeanHash) {
    throw new Error(
      `POE_CLOSURE_MISMATCH: intent ${intentId} — ` +
      `closure_proof ${closureProof} !== lean_hash ${expectedLeanHash}.`
    );
  }
}

/**
 * Returns true if the given IOBuffer has been frozen by the PoE guard.
 * Callers MUST check this before any enqueueWrite() call.
 */
export function isIOBufferFrozen(ioBuffer: IOBuffer): boolean {
  return frozenBuffers.has(ioBuffer);
}

/**
 * Runtime guard that wraps IOBuffer.enqueueWrite — throws if buffer is frozen.
 * Used to hard-enforce the "no writes after divergence" rule.
 */
export function guardedEnqueue(
  ioBuffer: IOBuffer,
  payload: any,
  exec: () => Promise<any>,
): void {
  if (frozenBuffers.has(ioBuffer)) {
    throw new Error(
      'DECT VIOLATION: Attempted write to a FROZEN IOBuffer. ' +
      'Pipeline was halted due to non-deterministic execution.'
    );
  }
  ioBuffer.enqueueWrite(payload, exec);
}

/**
 * Computes a stable SHA-256 fingerprint from an execution result for comparison.
 */
export function computeExecutionFingerprint(result: any): string {
  return crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex');
}
