import { KernelState } from '../core/state.js';
import { computeRisk } from '../core/governor.js';

export async function riskNode(state: KernelState): Promise<KernelState> {
  const risk = computeRisk(state.intent);
  return {
    ...state,
    risk
  };
}
