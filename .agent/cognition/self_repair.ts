import { FailurePrediction } from "./failure_predict";
import { CounterfactualScenario } from "./causal_simulator";

export interface SelfRepairProposal {
  issue_node: string;

  detected_problem:
    | "DRIFT"
    | "FAILURE_RISK"
    | "INTEGRATION_BREAK"
    | "CONTRACT_MISMATCH";

  proposed_intent: any;

  expected_drift_reduction: number;

  confidence: number;
}

export function generateSelfRepair(
  driftReport: any,
  failurePrediction: FailurePrediction,
  simulationResult: CounterfactualScenario
): SelfRepairProposal | null {
  const severity =
    driftReport.drift_score +
    failurePrediction.probability +
    simulationResult.drift_after;

  if (severity < 0.3) return null;

  return {
    issue_node: driftReport.node_id,
    detected_problem: "DRIFT",
    proposed_intent: {
      syscall: "intent.submit",
      action: "system.auto_heal",
      payload: {
        target: driftReport.node_id,
        fix_strategy: "minimize_coupling",
      },
    },
    expected_drift_reduction: Math.max(0, severity - 0.2),
    confidence: 0.85,
  };
}
