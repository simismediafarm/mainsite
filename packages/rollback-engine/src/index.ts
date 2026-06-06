import { HealthSnapshot } from "@simis/sentinel";
import { recordIncidentAndCheck, clearIncidentHistory } from "@simis/incident-debounce";
import { recordRollbackAndCheckLimit } from "@simis/rollback-rate-limiter";

export type ActionType = "ROLLBACK" | "WARN" | "NO_OP";

export interface RollbackRule {
  id: string;
  condition: (s: HealthSnapshot) => boolean;
  action: ActionType;
}

export const ROLLBACK_RULES: RollbackRule[] = [
  {
    id: "CRITICAL_API_FAILURE",
    condition: (s: HealthSnapshot) => s.api_error_rate > 0.05,
    action: "ROLLBACK",
  },
  {
    id: "PRISMA_RUNTIME_FAILURE",
    condition: (s: HealthSnapshot) => s.prisma_errors > 0,
    action: "ROLLBACK",
  },
  {
    id: "CONTRACT_VIOLATION",
    condition: (s: HealthSnapshot) => s.contract_violations > 0,
    action: "ROLLBACK",
  },
  {
    id: "LATENCY_DEGRADATION",
    condition: (s: HealthSnapshot) => s.p95_latency > 2000,
    action: "WARN",
  },
];

export async function evaluateRulesWithDebounce(snapshot: HealthSnapshot): Promise<{
  action: string;
  ruleId: string;
  payload: any;
  status: "OK" | "RATE_LIMITED";
}[]> {
  const decisions: {
    action: string;
    ruleId: string;
    payload: any;
    status: "OK" | "RATE_LIMITED";
  }[] = [];

  for (const rule of ROLLBACK_RULES) {
    if (rule.condition(snapshot)) {
      if (rule.action === "ROLLBACK") {
        const thresholdMet = recordIncidentAndCheck(rule.id, snapshot);
        if (thresholdMet) {
          const limitStatus = recordRollbackAndCheckLimit();
          decisions.push({
            action: rule.action,
            ruleId: rule.id,
            payload: snapshot,
            status: limitStatus === "RATE_LIMIT_EXCEEDED" ? "RATE_LIMITED" : "OK",
          });
          clearIncidentHistory(rule.id); // clear after successful trigger
        }
      } else {
        // Just a WARN, execute directly without rollback limiters
        decisions.push({
          action: rule.action,
          ruleId: rule.id,
          payload: snapshot,
          status: "OK",
        });
      }
    }
  }

  return decisions;
}
