export type Theorem =
  | "Crawler_Correctness_Theorem"
  | "LLM_Determinism_Theorem"
  | "IO_Safety_Theorem"
  | "Execution_Continuity_Theorem";

export const THEOREM_DB: Record<Theorem, {
  requiredInvariants: string[];
}> = {
  Crawler_Correctness_Theorem: {
    requiredInvariants: [
      "no_direct_commit_bypass",
      "io_buffer_isolation",
      "deterministic_transition"
    ]
  },

  LLM_Determinism_Theorem: {
    requiredInvariants: [
      "router_determinism",
      "hash_stable_output"
    ]
  },

  IO_Safety_Theorem: {
    requiredInvariants: [
      "no_external_write",
      "buffer_isolation"
    ]
  },

  Execution_Continuity_Theorem: {
    requiredInvariants: [
      "deferred_on_failure",
      "replay_possible"
    ]
  }
};
