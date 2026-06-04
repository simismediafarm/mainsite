import { THEOREM_DB } from "./theorem_registry.js";
import { IntentToTheorem } from "./intent_to_theorem_map.js";

export function theoremGate(intent: string, observedProof: any) {

  const theorem = IntentToTheorem[intent];

  if (!theorem) {
    throw new Error("[NO THEOREM ASSIGNED → EXECUTION BLOCKED]");
  }

  const required = THEOREM_DB[theorem].requiredInvariants;

  const passed = required.every(inv =>
    observedProof.constraints.includes(inv)
  );

  if (!passed) {
    throw new Error("[THEOREM GATE REJECTED EXECUTION]");
  }

  return true;
}
