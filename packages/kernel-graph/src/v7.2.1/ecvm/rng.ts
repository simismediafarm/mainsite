// packages/kernel-graph/src/v7.2.1/ecvm/rng.ts
import crypto from 'crypto';

/**
 * SeededRNG — deterministic PRNG using HMAC-SHA-256.
 *
 * rng(n) = HMAC-SHA-256(seed, counter‖n)  →  scaled to [0, 1)
 *
 * This replaces the placeholder Buffer conversion with a proper crypto PRF.
 * The same seed + call sequence always produces the identical sequence of floats.
 */
export class SeededRNG {
  private readonly seed: string;
  private counter: number = 0;

  constructor(seed: string) {
    this.seed = seed;
  }

  /**
   * Returns the next deterministic float in [0, 1).
   * Each call increments the internal counter, so the sequence is replay-safe.
   */
  next(): number {
    const data = `${this.counter}`;
    this.counter += 1;
    const hmac = crypto.createHmac('sha256', this.seed).update(data).digest('hex');
    // Take the first 8 hex chars (32 bits) and scale to [0, 1)
    const raw = parseInt(hmac.slice(0, 8), 16);
    return raw / 0x100000000; // divide by 2^32 → [0, 1)
  }

  /** Current counter (for trace logging). */
  currentCounter(): number {
    return this.counter;
  }
}
