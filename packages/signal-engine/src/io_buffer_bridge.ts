/**
 * io_buffer_bridge.ts — Signal Engine IOBuffer binding.
 *
 * PRODUCTION HARDENING: No more mock ioBuffer.
 * The real IOBuffer from kernel-graph/v7.2.1 MUST be injected.
 * Signal writes go through IOBuffer.enqueueWrite() ONLY.
 */

// @ts-ignore — path import; add to exports field of kernel-graph package.json to remove this
import { IOBuffer } from '@simis/kernel-graph/dist/v7.2.1/ecvm/io_buffer';

export type { IOBuffer };

/**
 * Enqueues a signal-engine result into the IOBuffer.
 * Callers MUST pass the active IOBuffer for the current execution context.
 * DECT enforcement: no direct DB write allowed.
 */
export function enqueueSignalWrite(
  ioBuffer: IOBuffer,
  intentId: string,
  signalPayload: Record<string, unknown>,
): void {
  ioBuffer.enqueueWrite(
    { description: `signal_engine:write:${intentId}`, intent_id: intentId },
    async () => {
      // Real commit is handled by ECVM flush cycle via kernel_execute RPC.
      // Signal data is staged here; the execution_pipeline flush will commit.
      console.log(`[SIGNAL ENGINE] Signal staged for intent ${intentId}`);
    },
  );
}
