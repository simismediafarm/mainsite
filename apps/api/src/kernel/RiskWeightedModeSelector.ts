export type ArbitrationMode = "STRICT" | "ADAPTIVE";

export interface RiskInput {
  /** 0.0–1.0. High risk = history of violations, unknown tenant, or sensitive namespace. */
  tenantRiskScore: number;
  /** Number of edges in the artifact dependency DAG. Deeper = more risk. */
  dependencyDepth: number;
  /** 0.0–1.0. Ratio of CDN edges currently in a non-COMPLETE convergence state. */
  cacheInconsistencyRatio: number;
}

export interface ModeSelectorResult {
  mode: ArbitrationMode;
  compositeRiskScore: number;
  rationale: string;
}

const STRICT_THRESHOLD = 0.65;

// Weights must sum to 1.0
const WEIGHTS = {
  tenantRisk: 0.45,
  dependencyDepth: 0.25,
  cacheInconsistency: 0.30,
} as const;

// Normalize dependency depth: assume > 10 levels = max risk
const MAX_DEPENDENCY_DEPTH = 10;

export class RiskWeightedModeSelector {
  /**
   * Computes a composite risk score and selects STRICT or ADAPTIVE mode.
   * This is a pure function: same input always produces the same output.
   * No runtime state. No side effects.
   */
  select(input: RiskInput): ModeSelectorResult {
    const normalizedDepth = Math.min(input.dependencyDepth / MAX_DEPENDENCY_DEPTH, 1.0);

    const compositeRiskScore =
      WEIGHTS.tenantRisk * input.tenantRiskScore +
      WEIGHTS.dependencyDepth * normalizedDepth +
      WEIGHTS.cacheInconsistency * input.cacheInconsistencyRatio;

    const mode: ArbitrationMode = compositeRiskScore > STRICT_THRESHOLD ? "STRICT" : "ADAPTIVE";

    const rationale =
      mode === "STRICT"
        ? `Composite risk ${compositeRiskScore.toFixed(3)} exceeds STRICT threshold ${STRICT_THRESHOLD}. Hard validation required.`
        : `Composite risk ${compositeRiskScore.toFixed(3)} within ADAPTIVE bounds. Deferred conflict resolution permitted.`;

    return { mode, compositeRiskScore, rationale };
  }
}
