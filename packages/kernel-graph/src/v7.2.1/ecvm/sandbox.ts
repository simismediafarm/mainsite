// packages/kernel-graph/src/v7.2.1/ecvm/sandbox.ts
import crypto from 'crypto';
import { FrozenClock } from './clock';
import { SeededRNG } from './rng';
import { patchGlobals, GdgViolation } from './gdg';

/**
 * ExecutionContext — the immutable ECVM state object bound to a single intent execution.
 *
 * C = (seed, clock, rng, io_mode, scheduler_epoch)
 *
 * The `__dirty__` flag is set by the ECVM internals if a forbidden mutation is detected.
 * DECTMiddleware checks this flag before allowing execution to proceed.
 */
export interface ExecutionContext {
  /** Deterministic seed derived from intentId + epoch. */
  readonly seed: string;
  /** Logical clock — frozen to the seed. */
  readonly clock: FrozenClock;
  /** Deterministic PRNG — seeded from seed. */
  readonly rng: SeededRNG;
  /** IO mode — controls whether side-effects are staged or replayed. */
  io_mode: 'live' | 'shadow' | 'replay';
  /** Active scheduling epoch identifier. */
  readonly scheduler_epoch: string;
  /**
   * Internal purity flag. Set to true if any GDG violation is detected
   * (e.g. a patched global was called without going through the ECVM path).
   * DECTMiddleware treats a dirty context as an ECVM_DIRTY hard failure.
   */
  __dirty__: boolean;
}

/**
 * Derive a deterministic seed from an intentId and an optional epoch identifier.
 * Seed = SHA-256(intentId || ":" || epoch)
 */
function deriveSeed(intentId: string, epoch: string): string {
  return crypto
    .createHash('sha256')
    .update(`${intentId}:${epoch}`, 'utf8')
    .digest('hex');
}

/**
 * Create a fresh ExecutionContext for a given intent.
 *
 * @param intentId   The unique identifier of the intent being executed.
 * @param epoch      The current scheduling epoch identifier (default: "epoch-0").
 * @param ioMode     IO mode for this execution (default: "live").
 *
 * Usage:
 *   const ctx = createExecutionContext('intent-uuid', 'epoch-1');
 *   DECTMiddleware.assertDeterministicExecution(intent, ctx, schedulerTrace);
 */
export function createExecutionContext(
  intentId: string,
  epoch: string = 'epoch-0',
  ioMode: 'live' | 'shadow' | 'replay' = 'live',
  seedOverride?: string
): ExecutionContext {
  const seed = seedOverride ?? deriveSeed(intentId, epoch);

  const ctx: ExecutionContext = {
    seed,
    clock: new FrozenClock(seed),
    rng: new SeededRNG(seed),
    io_mode: ioMode,
    scheduler_epoch: epoch,
    __dirty__: false,
  };

  return ctx;
}

/**
 * Activate global ECVM guards for the current process.
 * Must be called once at kernel bootstrap (before any intent is processed).
 *
 * - Patches Date.now, Math.random, fetch to throw GdgViolation.
 * - Sets up an uncaught exception handler that marks all active contexts dirty.
 *
 * IMPORTANT: This call is idempotent — calling it multiple times is safe.
 */
let _globalGuardActive = false;

export function initializeGlobalGuard(): void {
  if (_globalGuardActive) return;
  patchGlobals();
  _globalGuardActive = true;
}

export { GdgViolation };
