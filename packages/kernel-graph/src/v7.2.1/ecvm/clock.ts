// packages/kernel-graph/src/v7.2.1/ecvm/clock.ts
import crypto from 'crypto';

/**
 * FrozenClock — deterministic logical clock for ECVM.
 *
 * Rule: clock(step) = base(seed) + step
 * No system time, no wall-clock dependency.
 * base(seed) = first 4 bytes of SHA-256(seed) as uint32.
 */
export class FrozenClock {
  private readonly base: number;
  private step: number = 0;

  constructor(seed: string) {
    const hex = crypto.createHash('sha256').update(seed, 'utf8').digest('hex');
    this.base = parseInt(hex.slice(0, 8), 16); // first 4 bytes → 32-bit uint
  }

  /** Returns the deterministic timestamp for the current logical step, then increments. */
  now(): number {
    const ts = this.base + this.step;
    this.step += 1;
    return ts;
  }

  /** Current step index — for trace logging only. */
  currentStep(): number {
    return this.step;
  }
}
