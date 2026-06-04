import { TemporalNodeState } from "./drift_engine";

export interface FailurePrediction {
  node_id: string;
  failure_type: "RUNTIME" | "SCHEMA" | "INTEGRATION" | "LOGIC";

  probability: number;
  time_to_failure_estimate_hours: number;

  contributing_factors: string[];
}

export function predictFailureRisk(node: TemporalNodeState): FailurePrediction {
  const risk =
    node.metrics.coupling * 0.4 +
    node.metrics.change_rate * 0.4 +
    node.metrics.complexity * 0.2;

  return {
    node_id: node.node_id,
    failure_type: "RUNTIME", // Base assumption
    probability: Math.min(1, risk),
    time_to_failure_estimate_hours: Math.round(48 / (risk + 0.1)),
    contributing_factors: [
      "high coupling",
      "frequent mutation",
      "architecture instability",
    ],
  };
}
