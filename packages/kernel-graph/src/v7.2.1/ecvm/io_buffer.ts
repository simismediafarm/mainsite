// packages/kernel-graph/src/v7.2.1/ecvm/io_buffer.ts
/**
 * IOBuffer — deterministic staging layer for external side-effects.
 *
 * All IO operations MUST be enqueued here instead of being executed directly.
 * The buffer provides:
 *   1. Deterministic ordering — reads before writes, sequence numbers enforced.
 *   2. Optional persistence to `kernel_io_buffer` in Postgres (hybrid mode).
 *   3. A `snapshot()` method for PoE io_hash generation.
 *   4. Deterministic flush — reproducible ordering across replay.
 *
 * Constraints (from formal spec):
 *   I1: io_op ∈ writeQueue ∧ not executed immediately
 *   I2: Replay(IO_trace) = IO_trace_live
 */

import { getSupabase } from '../../executor/kernelExecutor';

export type IOOperation = {
  opType: 'read' | 'write';
  seq: number;
  payload: any; // opaque description — stored as JSONB
  exec: () => Promise<any>;
};

export class IOBuffer {
  private readQueue: IOOperation[] = [];
  private writeQueue: IOOperation[] = [];
  private readonly deterministicMode: boolean;
  private readonly persist: boolean;
  private readonly intentId: string;
  private readonly ecvmSeed: string;
  private enqueuedOps = new Set<string>(); // dedupe execution guard
  private seqCounter: number = 0;
  constructor(intentId: string, ecvmSeed: string, deterministicMode = true, persist = true) {
    this.intentId = intentId;
    this.ecvmSeed = ecvmSeed;
    this.deterministicMode = deterministicMode;
    this.persist = persist;
  }

  private generateIdempotencyKey(seq: number): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256')
      .update(`${this.intentId}:${this.ecvmSeed}:${seq}`)
      .digest('hex');
  }

  /** Enqueue a read operation. Reads always execute before writes during flush. */
  enqueueRead(payload: any, exec: () => Promise<any>): void {
    const op: IOOperation = {
      opType: 'read',
      seq: this.seqCounter++,
      payload,
      exec,
    };
    this.readQueue.push(op);
    // Fire-and-forget persistence — does not block the hot path.
    this.persistOperation(op).catch((err) => {
      console.warn(`[IO BUFFER] Failed to persist read op seq=${op.seq}:`, err?.message);
    });
  }

  /** Enqueue a write operation. */
  enqueueWrite(payload: any, exec: () => Promise<any>): void {
    const op: IOOperation = {
      opType: 'write',
      seq: this.seqCounter++,
      payload,
      exec,
    };
    this.writeQueue.push(op);
    this.persistOperation(op).catch((err) => {
      console.warn(`[IO BUFFER] Failed to persist write op seq=${op.seq}:`, err?.message);
    });
  }

  /**
   * Persist a single IO operation to `kernel_io_buffer` in Postgres.
   * This is the real implementation — previously was a stub.
   */
  private async persistOperation(op: IOOperation): Promise<void> {
    const idempotencyKey = this.generateIdempotencyKey(op.seq);
    
    // Dedupe Guard: Hard invariant enforcement
    if (this.enqueuedOps.has(idempotencyKey)) {
      throw new Error(`[IO BUFFER GDG] Dedupe violation: Operation with idempotency key ${idempotencyKey} is already enqueued or executing!`);
    }
    this.enqueuedOps.add(idempotencyKey);

    if (!this.persist) return;
    const supabase = getSupabase();

    await supabase.from('kernel_io_buffer').insert({
      intent_id: this.intentId,
      op_type: op.opType,
      payload: op.payload,
      seq: op.seq,
      idempotency_key: idempotencyKey
    });
  }

  /**
   * Flush the queued operations in deterministic order:
   *   1. All reads in ascending seq order.
   *   2. All writes in ascending seq order.
   *
   * This ordering is the formal contract — it must match the replay order.
   */
  async flush(): Promise<void> {
    // Sort by seq to guarantee replay-stable ordering
    const reads = [...this.readQueue].sort((a, b) => a.seq - b.seq);
    const writes = [...this.writeQueue].sort((a, b) => a.seq - b.seq);

    for (const op of reads) {
      await op.exec();
    }
    for (const op of writes) {
      await op.exec();
    }

    // Reset queues after successful flush
    this.readQueue = [];
    this.writeQueue = [];
  }

  /**
   * Return an immutable snapshot of all enqueued operations for PoE io_hash generation.
   * Called BEFORE flush so the hash covers the full intended IO set.
   */
  snapshot(): Array<{ opType: string; seq: number; payload: any }> {
    return [
      ...this.readQueue.map((op) => ({ opType: op.opType, seq: op.seq, payload: op.payload })),
      ...this.writeQueue.map((op) => ({ opType: op.opType, seq: op.seq, payload: op.payload })),
    ].sort((a, b) => a.seq - b.seq);
  }
}
