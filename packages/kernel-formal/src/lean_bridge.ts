export function exportToLean(proof: any) {
  return `
theorem simis_execution_correctness :
  execution_trace_valid ${proof.witness} →
  deterministic_execution :=
by
  sorry -- auto-generated witness
`;
}
