import { KernelState } from '../core/state.js';
import { evaluatePolicy } from '../core/governor.js';

export async function policyNode(state: KernelState): Promise<KernelState> {
  // Check policy rules
  const decision = evaluatePolicy(state.intent, state.risk);
  return {
    ...state,
    decision
  };
}
