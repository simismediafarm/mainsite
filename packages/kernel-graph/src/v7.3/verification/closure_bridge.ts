import { DECTViolation } from "./invariant_engine";

/**
 * Proof‑Carrying Execution Closure Bridge (ECK)
 *
 * Ensures that the runtime‑generated Proof‑of‑Execution (PoE) contains a
 * `closure_proof` hash that exactly matches the Lean‑derived theorem hash for the
 * given intent and execution context.
 *
 * This is the critical enforcement point that turns the dual‑plane architecture
 * from a specification into an enforceable system.
 */

/** Minimal PoE shape – extend as needed */
export interface PoE {
  intent_id: string;
  execution_hash: string;
  state_hash: string;
  scheduler_hash: string;
  io_hash: string;
  ecvm_seed: string;
  /**
   * Hash of the instantiated Lean DECT theorem for this execution.
   * Produced by the Lean side (e.g., via a small helper that hashes the
   * theorem statement together with concrete parameters).
   */
  closure_proof: string;
}

/** Minimal Intent shape – only fields required for validation */
export interface Intent {
  id: string;
  // other fields are irrelevant for the closure check
}

/**
 * Validate that the runtime PoE aligns with the Lean proof hash.
 * Throws a DECTViolation if any invariant is violated.
 */
export function validateExecutionClosure(params: {
  runtimePoE: PoE;
  leanProofHash: string;
  intent: Intent;
}): true {
  const { runtimePoE, leanProofHash, intent } = params;

  // 1️⃣ Basic PoE sanity – all critical hashes must be present.
  const runtimeValid =
    runtimePoE.execution_hash &&
    runtimePoE.scheduler_hash &&
    runtimePoE.io_hash &&
    runtimePoE.closure_proof;

  if (!runtimeValid) {
    throw new DECTViolation(
      "POE_INCOMPLETE",
      `PoE missing required hash fields for intent ${intent.id}`
    );
  }

  // 2️⃣ Closure proof must match the Lean‑derived hash.
  const closureMatch = runtimePoE.closure_proof === leanProofHash;

  if (!closureMatch) {
    throw new DECTViolation(
      "CLOSURE_MISMATCH",
      `Runtime closure proof does not match Lean proof for intent ${intent.id}`
    );
  }

  // All checks passed – the execution is formally verified.
  return true;
}
