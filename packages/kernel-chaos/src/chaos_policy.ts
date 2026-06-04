export type ChaosMode = "NORMAL" | "CHAOS_TEST";

export interface ChaosPolicy {
  mode: ChaosMode;

  // HARD CONSTRAINT: ONLY ENVIRONMENT LAYER
  affect: "environment-only";

  forbiddenTargets: [
    "io_buffer",
    "poe_hash",
    "dag_structure",
    "state_machine",
    "execution_order"
  ];

  config: {
    latencyMsRange: [number, number];
    rateLimitProbability: number;
    networkPartitionProbability: number;
  };
}

export const DEFAULT_CHAOS_POLICY: ChaosPolicy = {
  mode: "NORMAL",
  affect: "environment-only",
  forbiddenTargets: [
    "io_buffer",
    "poe_hash",
    "dag_structure",
    "state_machine",
    "execution_order"
  ],
  config: {
    latencyMsRange: [0, 2000],
    rateLimitProbability: 0.1,
    networkPartitionProbability: 0.05
  }
};
