import { KernelState } from '../core/state.js';

export async function shadowNode(state: KernelState): Promise<KernelState> {
  // Simulate database writes using dry-run verification
  const isDestructive = state.intent.action === 'DELETE';
  const diffScore = isDestructive ? 0.40 : 0.02; // higher diff for deletes
  
  const shadowResult = {
    safe: diffScore < 0.50, // Flag as unsafe if diff score exceeds 50%
    diffScore
  };

  return {
    ...state,
    shadow_result: shadowResult
  };
}
