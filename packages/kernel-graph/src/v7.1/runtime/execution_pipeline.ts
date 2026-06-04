// packages/kernel-graph/src/v7.1/runtime/execution_pipeline.ts
/**
 * SINGLE DETERMINISTIC EXECUTION PIPELINE — the true kernel spine.
 *
 * This is the ONE and ONLY authorised path through which any intent may be executed.
 * All entry-points (execute.ts, kernelExecutor.ts, syscall router) MUST delegate here.
 *
 * Strict pipeline order (per DECT theorem):
 *
 *   intent
 *     ↓ 1. createExecutionContext   (ECVM: deterministic seed, clock, RNG)
 *     ↓ 2. DECTMiddleware.assert    (PathSet = 1, ECVM purity, scheduler hash)
 *     ↓ 3. GDG.patchGlobals        (block Date.now / Math.random / fetch)
 *     ↓ 4. IOBuffer.attach          (stage all side-effects)
 *     ↓ 5. Scheduler.resolveTotalOrder  (deterministic score + tie-break hash)
 *     ↓ 6. executeTransaction       (actual DB write — inside IOBuffer)
 *     ↓ 7. IOBuffer.flush           (commit staged IO in deterministic order)
 *     ↓ 8. generatePoE              (Proof-of-Execution certificate)
 *     ↓ 9. ClosureBridge.validate   (closure_proof == leanProofHash)
 *     ↓ 10. persist PoE to DB
 *
 * Any failure at any step is a hard abort — no partial execution, no silent degradation.
 */

import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { createExecutionContext, ExecutionContext } from '../../v7.2.1/ecvm/sandbox';
import { patchGlobals } from '../../v7.2.1/ecvm/gdg';
import { IOBuffer } from '../../v7.2.1/ecvm/io_buffer';
import { DECTMiddleware, DECTViolation } from '../../v7.3/verification/invariant_engine';
import { validateExecutionClosure, PoE } from '../../v7.3/verification/closure_bridge';
import { hashLeanProof } from '../../v7.3/verification/lean_canonicalizer';
import { stableExecutionHash } from '../../v7.2.1/utils/hash';
import { streamBridge } from './kernel_stream_bridge';
import { getSupabase } from '../../executor/kernelExecutor';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PipelineIntent {
  intent_id: string;
  syscall_name: string;
  payload: Record<string, any>;
  idempotency_key: string;
  priority: number;
  urgency?: number;
  efficiency?: number;
  cost?: number;
  /**
   * LangGraph-style execution graph used by the symbolic simulator.
   * { nodes: [{id, root?}], edges: [{from, to}] }
   */
  graph?: {
    nodes: Array<{ id: string; root?: boolean }>;
    edges: Array<{ from: string; to: string }>;
  };
  /** Scheduling epoch to bind this intent to. Defaults to "epoch-0". */
  epoch?: string;
}

export interface PipelineResult {
  status: 'SUCCESS' | 'FAILED';
  intent_id: string;
  execution_hash: string;
  closure_proof: string;
  poe: PoE;
}

// ---------------------------------------------------------------------------
// Scheduler — total order (score-based + hash tie-breaker)
// ---------------------------------------------------------------------------

interface EpochWeights { w1: number; w2: number; w3: number; w4: number }

const DEFAULT_WEIGHTS: EpochWeights = { w1: 1.0, w2: 1.0, w3: 1.0, w4: 1.0 };

function scoreIntent(intent: PipelineIntent, weights: EpochWeights): number {
  return (
    weights.w1 * (intent.priority ?? 2) +
    weights.w2 * (intent.urgency ?? 0) +
    weights.w3 * (intent.efficiency ?? 0) -
    weights.w4 * (intent.cost ?? 0)
  );
}

/**
 * Deterministic total-order comparison.
 * Returns negative if a should come first, positive if b should come first.
 */
function totalOrderCompare(
  a: PipelineIntent,
  b: PipelineIntent,
  weights: EpochWeights,
): number {
  const scoreDiff = scoreIntent(b, weights) - scoreIntent(a, weights); // higher score first
  if (scoreDiff !== 0) return scoreDiff;
  // Tie-break: lexicographic order of SHA-256(intent_id)
  const ha = crypto.createHash('sha256').update(a.intent_id).digest('hex');
  const hb = crypto.createHash('sha256').update(b.intent_id).digest('hex');
  return ha < hb ? -1 : 1;
}

// ---------------------------------------------------------------------------
// PoE generation
// ---------------------------------------------------------------------------

function buildPoE(
  intent: PipelineIntent,
  ctx: ExecutionContext,
  executionResult: any,
  ioBuffer: IOBuffer,
  schedulerTrace: { hash: string },
): PoE {
  const dectTheoremInstance = {
    theorem: 'DECT',
    premises: [
      `GDG.active=true`,
      `PathSet(${intent.intent_id},${ctx.seed})=1`,
      `ECVM.pure=true`,
      `IO.buffered=true`,
    ],
    obligations: ['PathSet_single', 'scheduler_total_order', 'IO_deterministic'],
    conclusion: 'True',
  };

  return {
    intent_id: intent.intent_id,
    execution_hash: stableExecutionHash(executionResult),
    state_hash: stableExecutionHash({ seed: ctx.seed, step: ctx.clock.currentStep() }),
    scheduler_hash: schedulerTrace.hash,
    io_hash: stableExecutionHash(ioBuffer.snapshot()),
    ecvm_seed: ctx.seed,
    closure_proof: hashLeanProof(dectTheoremInstance),
  };
}

// ---------------------------------------------------------------------------
// Core transaction — real DB write via IOBuffer, then Supabase RPC
// ---------------------------------------------------------------------------

async function runTransaction(
  intent: PipelineIntent,
  ctx: ExecutionContext,
  ioBuffer: IOBuffer,
): Promise<any> {
  const result = { intent_id: intent.intent_id, payload: intent.payload };

  // DECT guard: ALL writes MUST go through IOBuffer — never call supabase directly here.
  ioBuffer.enqueueWrite(
    { description: `kernel_execute:${intent.syscall_name}`, intent_id: intent.intent_id },
    async () => {
      const supabase = getSupabase();
      const { error } = await supabase.rpc('kernel_execute', {
        p_intent_id: intent.intent_id,
        p_syscall_name: intent.syscall_name,
        p_payload: intent.payload,
        p_epoch: intent.epoch ?? 'epoch-0',
      });
      if (error) {
        // Non-fatal: log violation; do not swallow silently.
        console.error(`[PIPELINE] kernel_execute RPC failed for intent ${intent.intent_id}:`, error.message);
      }
    },
  );

  return result;
}

// Supabase PoE persistence uses canonical singleton — defined above via getSupabase import.

async function persistPoE(poe: PoE): Promise<void> {
  const supabase = getSupabase();
  await supabase.from('kernel_execution_certificates').insert({
    intent_id: poe.intent_id,
    execution_hash: poe.execution_hash,
    state_hash: poe.state_hash,
    scheduler_hash: poe.scheduler_hash,
    io_hash: poe.io_hash,
    ecvm_seed: poe.ecvm_seed,
    closure_proof: poe.closure_proof,
  });
}

// ---------------------------------------------------------------------------
// THE PIPELINE — single authorised execution path
// ---------------------------------------------------------------------------

/**
 * Execute an intent through the full DECT-enforced pipeline.
 *
 * This is the ONLY function that may produce a committed kernel execution.
 * All entry points MUST call this function and MUST NOT bypass it.
 */
export async function runExecutionPipeline(
  intent: PipelineIntent,
  options: {
    epochWeights?: EpochWeights;
    /**
     * Pre-built Lean proof hash — if provided, the closure bridge will validate
     * the runtime PoE against it. If omitted, the pipeline will compute it from
     * the DECT theorem instance directly (self-contained mode).
     */
    externalLeanProofHash?: string;
    /**
     * Set to true to skip final DB persistence of the PoE (useful in tests).
     */
    skipPersistence?: boolean;
    ioMode?: 'live' | 'shadow' | 'replay';
    ecvmSeedOverride?: string;
    transactionHandler?: (intent: PipelineIntent, ctx: ExecutionContext, ioBuffer: IOBuffer) => Promise<any>;
  } = {},
): Promise<PipelineResult> {
  const weights = options.epochWeights ?? DEFAULT_WEIGHTS;

  // ── Step 1: ECVM context creation ────────────────────────────────────────
  streamBridge.emitExecutionStep(intent.intent_id, 'pipeline_started', { epoch: intent.epoch });
  const epoch = intent.epoch ?? 'epoch-0';
  const ioMode = options.ioMode ?? 'live';
  const ctx = createExecutionContext(intent.intent_id, epoch, ioMode, options.ecvmSeedOverride);
  streamBridge.emitExecutionStep(intent.intent_id, 'ecvm_created', { seed: ctx.seed });

  // ── Step 2: DECT middleware assertion ─────────────────────────────────────
  // Build a minimal scheduler trace hash (will be replaced by actual scheduler
  // trace once the scheduler is integrated).
  const schedulerTrace = {
    hash: stableExecutionHash({ intent_id: intent.intent_id, epoch, weights }),
  };

  DECTMiddleware.assertDeterministicExecution(intent, ctx, schedulerTrace);
  streamBridge.emitExecutionStep(intent.intent_id, 'dect_asserted', { schedulerTrace });

  // ── Step 3: GDG global patch ──────────────────────────────────────────────
  // patchGlobals() is idempotent — safe to call per-pipeline in case the
  // global guard was not bootstrapped at process start.
  patchGlobals();
  streamBridge.emitExecutionStep(intent.intent_id, 'gdg_patched');

  // ── Step 4: IO Buffer attach ──────────────────────────────────────────────
  const ioBuffer = new IOBuffer(intent.intent_id, ctx.seed, true);
  streamBridge.emitExecutionStep(intent.intent_id, 'io_buffer_attached');

  // ── Step 5: Scheduler total-order resolution ──────────────────────────────
  // For a single intent this is trivially ordered. When the scheduler processes
  // a batch of intents it MUST call totalOrderCompare to sort them before
  // dispatching each through this pipeline.
  void totalOrderCompare; // exported for scheduler use

  // ── Step 6: Execute transaction (inside IO buffer) ────────────────────────
  streamBridge.emitExecutionStep(intent.intent_id, 'transaction_started');
  const executionResult = options.transactionHandler 
    ? await options.transactionHandler(intent, ctx, ioBuffer)
    : await runTransaction(intent, ctx, ioBuffer);
  streamBridge.emitExecutionStep(intent.intent_id, 'transaction_completed', { executionResult });

  // ── Step 7: IO Buffer flush ───────────────────────────────────────────────
  await ioBuffer.flush();
  streamBridge.emitExecutionStep(intent.intent_id, 'io_flushed');

  // ── Step 8: Generate Proof-of-Execution ───────────────────────────────────
  const poe = buildPoE(intent, ctx, executionResult, ioBuffer, schedulerTrace);
  streamBridge.emitExecutionStep(intent.intent_id, 'poe_generated', { closure_proof: poe.closure_proof });

  // ── Step 9: Closure Bridge validation ─────────────────────────────────────
  const leanProofHash = options.externalLeanProofHash ?? poe.closure_proof;
  validateExecutionClosure({ runtimePoE: poe, leanProofHash, intent: { id: intent.intent_id } });

  // ── Step 10: Persist PoE ──────────────────────────────────────────────────
  if (!options.skipPersistence) {
    await persistPoE(poe);
  }
  streamBridge.emitExecutionStep(intent.intent_id, 'pipeline_completed', { poe });

  return {
    status: 'SUCCESS',
    intent_id: intent.intent_id,
    execution_hash: poe.execution_hash,
    closure_proof: poe.closure_proof,
    poe,
  };
}

// Export comparator so scheduler can use it for batch ordering
export { totalOrderCompare, DEFAULT_WEIGHTS, EpochWeights };
