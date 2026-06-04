import { theoremGate } from "./theorem_gate.js";

export function authorizeExecution(intent: any, proof: any) {

  try {
    const ok = theoremGate(intent.type, proof);

    if (!ok) {
      return {
        status: "BLOCKED",
        reason: "THEOREM_NOT_SATISFIED"
      };
    }

    return {
      status: "AUTHORIZED",
      executionMode: "DETERMINISTIC_LOCKED"
    };
  } catch (err: any) {
    return {
      status: "BLOCKED",
      reason: err.message
    };
  }
}
