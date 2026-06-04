import { ExecutionContext } from "../../v7.2.1/ecvm/sandbox";
import { stableExecutionHash } from "../../v7.2.1/utils/hash";
import { runSymbolicSimulation } from "./symbolic_simulator.js";
import { getSupabase } from '../../executor/kernelExecutor';

export class DECTViolation extends Error {
  constructor(public code: string, message: string) {
    super(`[DECT:${code}] ${message}`);
  }
}

function logViolation(intentId: string | null, code: string, message: string) {
  const supabase = getSupabase();
  supabase.from('kernel_dect_violations').insert({
    intent_id: intentId,
    violation_code: code,
    message
  }).then(({ error }: { error: any }) => {
    if (error) console.error('[DECT] Failed to log violation:', error.message);
  });
}

export class DECTMiddleware {

  static assertDeterministicExecution(intent: any, ctx: ExecutionContext, schedulerTrace: any) {

    const throwViolation = (code: string, message: string) => {
      logViolation(intent?.intent_id || null, code, message);
      throw new DECTViolation(code, message);
    };

    // 1. GDG is assumed enforced earlier in runtime layer
    if (!ctx) throwViolation("CTX_NULL", "Missing ECVM context");

    // 2. ECVM purity check (lightweight invariant)
    if ((ctx as any).__dirty__) {
      throwViolation("ECVM_DIRTY", "Execution context mutated outside ECVM rules");
    }

    // 3. Symbolic execution constraint: |PathSet| = 1
    const pathSet = runSymbolicSimulation(intent, ctx);

    if (pathSet.length !== 1) {
      throwViolation(
        "ND_01",
        `Non-deterministic branch detected: PathSet=${pathSet.length}`
      );
    }

    // 4. Scheduler total-order validation (deterministic hash check)
    const expectedSchedulerHash = stableExecutionHash(schedulerTrace);
    if (schedulerTrace.hash !== expectedSchedulerHash) {
      throwViolation(
        "SCH_01",
        "Scheduler ordering mismatch (non-deterministic ordering detected)"
      );
    }

    return {
      ok: true,
      path: pathSet[0]
    };
  }
}
