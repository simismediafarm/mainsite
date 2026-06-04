import { SystemGraph } from "./global_graph";

export interface CounterfactualScenario {
  intent_patch: any;
  predicted_system_state: any;
  drift_after: number;
  side_effects: string[];
}

export function applyIntent(graph: SystemGraph, intent: any): SystemGraph {
  return graph; // Stub
}

export function compareGraphs(a: SystemGraph, b: SystemGraph): number {
  return 0.0; // Stub
}

export function extractSideEffects(a: SystemGraph, b: SystemGraph): string[] {
  return []; // Stub
}

export function simulateChange(currentGraph: SystemGraph, intentPatch: any): CounterfactualScenario {
  const simulated = applyIntent(currentGraph, intentPatch);
  const driftAfter = compareGraphs(currentGraph, simulated);

  return {
    intent_patch: intentPatch,
    predicted_system_state: simulated,
    drift_after: driftAfter,
    side_effects: extractSideEffects(currentGraph, simulated),
  };
}
