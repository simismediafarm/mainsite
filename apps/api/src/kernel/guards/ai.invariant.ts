import { AsyncLocalStorage } from 'async_hooks';

export type AIStep = 'CACHE' | 'DB' | 'RULE' | 'GEMINI' | 'OPENROUTER' | 'CHATGPT' | 'FALLBACK';

const PIPELINE_ORDER: AIStep[] = ['CACHE', 'DB', 'RULE', 'GEMINI', 'OPENROUTER', 'CHATGPT', 'FALLBACK'];

export interface AIPipelineState {
  traceId: string;
  completedSteps: AIStep[];
}

export const aiPipelineStorage = new AsyncLocalStorage<AIPipelineState>();

export class AIPipelineGuard {
  /**
   * Starts a deterministic AI execution pipeline.
   */
  static async execute<T>(traceId: string, run: () => Promise<T>): Promise<T> {
    const state: AIPipelineState = {
      traceId,
      completedSteps: []
    };

    return aiPipelineStorage.run(state, run);
  }

  /**
   * Asserts and records a pipeline step.
   * Throws if steps are bypassed or run out of order.
   */
  static recordStep(step: AIStep) {
    const state = aiPipelineStorage.getStore();
    
    // In test environment, relax the guard if SIK_BYPASS is set
    if (process.env.NODE_ENV === 'test' || process.env.SIK_BYPASS === 'true') {
      return;
    }

    if (!state) {
      throw new Error(`[AI Invariant Violation] AI step "${step}" executed outside a registered AIPipeline context. All AI executions must use AIPipelineGuard.execute.`);
    }

    const stepIndex = PIPELINE_ORDER.indexOf(step);
    if (stepIndex === -1) {
      throw new Error(`[AI Invariant Violation] Unregistered AI step "${step}" (reject_execution).`);
    }

    // Enforce that all prior steps have been visited
    for (let i = 0; i < stepIndex; i++) {
      const priorStep = PIPELINE_ORDER[i];
      if (!state.completedSteps.includes(priorStep)) {
        throw new Error(`[AI Invariant Violation] Out of order execution: step "${step}" bypassed prior step "${priorStep}" (reject_execution).`);
      }
    }

    // Add current step to completed list if not already there
    if (!state.completedSteps.includes(step)) {
      state.completedSteps.push(step);
    }
  }

  /**
   * Verifies that the fallback was explicit.
   */
  static recordExplicitFallback(reason: string) {
    this.recordStep('FALLBACK');
    console.log(`[AI Invariant] Explicit Fallback Registered: ${reason}`);
  }
}
