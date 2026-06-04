import { Theorem } from "./theorem_registry.js";

export const IntentToTheorem: Record<string, Theorem> = {
  crawl: "Crawler_Correctness_Theorem",
  llm_call: "LLM_Determinism_Theorem",
  io_write: "IO_Safety_Theorem",
  recover: "Execution_Continuity_Theorem"
};
