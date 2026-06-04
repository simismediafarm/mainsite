/**
 * executive_fsm.ts — Deterministic Arbitration Layer (DAL)
 *
 * PRODUCTION HARDENING: IOBuffer must be injected — no mock allowed.
 * All DECISION_COMMIT writes go through IOBuffer.enqueueWrite().
 */

// @ts-ignore — will be resolved when exports are added to kernel-graph/package.json
import { IOBuffer } from '@simis/kernel-graph/dist/v7.2.1/ecvm/io_buffer';
import * as crypto from 'crypto';

export type DecisionState =
  | "APPROVE_PUBLISH"
  | "HOLD_FOR_REVIEW"
  | "DISCARD"
  | "ESCALATE_REFINEMENT";

export interface ExecutiveInput {
  signals: any[];
  context: any;
  llm_advice: any;
  /** IOBuffer for the current execution context — REQUIRED in production */
  ioBuffer: IOBuffer;
}

export class ExecutiveFSM {

  async run(input: ExecutiveInput) {
    if (!input.ioBuffer) {
      throw new Error('[DECT VIOLATION] ExecutiveFSM.run called without IOBuffer — direct write forbidden');
    }

    const score = this.computeDeterministicScore(input.signals);
    const decision = this.evaluateDecision(score, input.llm_advice);

    // Stage DECISION_COMMIT via IOBuffer — never write to DB directly.
    input.ioBuffer.enqueueWrite({
      type: "DECISION_COMMIT",
      payload: {
        decision,
        score,
        signals: input.signals,
        llm_advice_hash: this.hash(input.llm_advice)
      }
    }, async () => {
      // Actual DB commit happens during ECVM flush via kernel_execute RPC.
      console.log(`[EXECUTIVE FSM] Decision staged: ${decision} (score: ${score})`);
    });

    return decision;
  }

  computeDeterministicScore(signals: any[]) {
    if (!signals.length) return 0;
    return signals.reduce((acc, s) => acc + s.score, 0) / signals.length;
  }

  evaluateDecision(score: number, llm: any): DecisionState {
    if (score > 0.85) return "APPROVE_PUBLISH";
    if (score > 0.60) return "HOLD_FOR_REVIEW";
    if (score < 0.40) return "DISCARD";
    return "ESCALATE_REFINEMENT";
  }

  hash(obj: any) {
    return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex");
  }
}

