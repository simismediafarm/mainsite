// packages/kernel-graph/src/v7.1/scheduler/core.ts
/**
 * KernelScheduler — deterministic total-order scheduler (v7.3+).
 *
 * Replaces the previous 4-bucket partial-order system with a score-based
 * deterministic sort that satisfies Theorem S1 (total order) from the formal spec.
 *
 * Ordering rule:
 *   Score(i) = w1·priority + w2·urgency + w3·efficiency − w4·cost
 *   Tie-break: lexicographic order of SHA-256(intent_id)
 *
 * This guarantees:
 *   ∀ i₁, i₂ ∈ I:  i₁ ≺ i₂  ∨  i₂ ≺ i₁  ∨  i₁ = i₂
 *
 * Epoch weights are loaded once at boot from `kernel_scheduling_epochs` (immutable
 * snapshot). The default epoch uses neutral weights (1.0, 1.0, 1.0, 1.0).
 */

import crypto from 'crypto';
import { runExecutionPipeline, PipelineIntent, EpochWeights, DEFAULT_WEIGHTS } from '../runtime/execution_pipeline';

// ---------------------------------------------------------------------------
// Score + comparator (re-exported so execution_pipeline can use the same)
// ---------------------------------------------------------------------------

function scoreIntent(intent: PipelineIntent, w: EpochWeights): number {
  return (
    w.w1 * (intent.priority ?? 2) +
    w.w2 * (intent.urgency ?? 0) +
    w.w3 * (intent.efficiency ?? 0) -
    w.w4 * (intent.cost ?? 0)
  );
}

function intentHash(intentId: string): string {
  return crypto.createHash('sha256').update(intentId).digest('hex');
}

/**
 * Deterministic total-order comparator.
 * Returns negative if `a` executes before `b`.
 */
export function totalOrderCompare(
  a: PipelineIntent,
  b: PipelineIntent,
  weights: EpochWeights = DEFAULT_WEIGHTS,
): number {
  const diff = scoreIntent(b, weights) - scoreIntent(a, weights); // higher score → earlier
  if (diff !== 0) return diff;
  // Stable tie-break — never returns 0 for distinct intents
  const ha = intentHash(a.intent_id);
  const hb = intentHash(b.intent_id);
  return ha < hb ? -1 : 1;
}

// ---------------------------------------------------------------------------
// KernelScheduler
// ---------------------------------------------------------------------------

export class KernelScheduler {
  private static instance: KernelScheduler;
  private queue: PipelineIntent[] = [];
  private isProcessing: boolean = false;
  private isPreempted: boolean = false;
  private weights: EpochWeights = DEFAULT_WEIGHTS;

  private constructor() {}

  public static getInstance(): KernelScheduler {
    if (!KernelScheduler.instance) {
      KernelScheduler.instance = new KernelScheduler();
    }
    return KernelScheduler.instance;
  }

  /**
   * Load epoch weights from DB (called once at boot).
   * Falls back to DEFAULT_WEIGHTS if no epoch record is found.
   */
  public loadEpochWeights(weights: EpochWeights): void {
    this.weights = weights;
    console.log(`[SCHEDULER] Epoch weights loaded: ${JSON.stringify(weights)}`);
  }

  /** Enqueue an intent and trigger the deterministic dispatch loop. */
  public async enqueue(intent: PipelineIntent): Promise<void> {
    this.queue.push(intent);
    // Re-sort the entire queue after each insertion to maintain total order.
    // For production use a priority queue (e.g. min-heap) for O(log n) insertion.
    this.queue.sort((a, b) => totalOrderCompare(a, b, this.weights));
    console.log(
      `[SCHEDULER] Enqueued intent ${intent.intent_id}` +
      ` | score=${scoreIntent(intent, this.weights).toFixed(2)}` +
      ` | queue_depth=${this.queue.length}`,
    );
    await this.tick();
  }

  /** Preempt execution (e.g. on INT_FRAUD_DETECTED). */
  public preempt(): void {
    console.warn(`[SCHEDULER] Preemption signal received. Halting execution loop.`);
    this.isPreempted = true;
  }

  public resume(): void {
    console.log(`[SCHEDULER] Resuming execution loop.`);
    this.isPreempted = false;
    this.tick();
  }

  private async tick(): Promise<void> {
    if (this.isProcessing || this.isPreempted) return;
    this.isProcessing = true;

    try {
      while (this.queue.length > 0 && !this.isPreempted) {
        const intent = this.queue.shift()!;
        console.log(`[SCHEDULER] Dispatching intent ${intent.intent_id} through DECT pipeline.`);
        // All intents now go through the single gated pipeline.
        await runExecutionPipeline(intent, { epochWeights: this.weights });
      }
    } finally {
      this.isProcessing = false;
    }
  }
}
