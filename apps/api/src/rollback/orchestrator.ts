import { HealthSnapshot } from "@simis/sentinel";
import { evaluateRulesWithDebounce } from "@simis/rollback-engine";
import { executeRollbackAction, updateDeploymentState } from "@simis/rollback-executor";
import { DeploymentState } from "@simis/state-machine";

export async function evaluateHealth(snapshot: HealthSnapshot) {
  const decisions = await evaluateRulesWithDebounce(snapshot);
  
  for (const decision of decisions) {
    if (decision.status === "RATE_LIMITED") {
      console.error(`[ORCHESTRATOR] ROLLBACK RATE LIMIT EXCEEDED. Freezing system state.`);
      await updateDeploymentState(DeploymentState.EMERGENCY_STABLE_HOLD);
    } else {
      if (decision.action === "ROLLBACK") {
        await executeRollbackAction(decision.action, decision.ruleId, decision.payload);
        await updateDeploymentState(DeploymentState.ROLLBACK_COOLDOWN);
      } else {
        await executeRollbackAction(decision.action, decision.ruleId, decision.payload);
      }
    }
  }
}
