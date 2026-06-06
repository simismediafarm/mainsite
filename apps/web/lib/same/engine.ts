import { EndpointMigrationState, store } from "./state";
import { TrafficSignal } from "../gateway/telemetry";

const MIGRATION_THRESHOLD = 0.85;
const ROLLBACK_THRESHOLD = 0.55;

export async function collectMetrics(endpoint: string): Promise<TrafficSignal> {
  // In a real implementation, this would fetch from Redis/Datadog
  return {
    latencyV1: 100,
    latencyV2: 120,
    errorRateV1: 0.01,
    errorRateV2: 0.05,
    endpoint,
    userSegment: "new"
  };
}

export function computeConfidence(metrics: TrafficSignal, schemaStability: number = 1.0): number {
  const E = metrics.errorRateV2;
  const L = Math.min(1, metrics.latencyV2 / 1000); // normalized latency
  const S = schemaStability;
  return (1 - E) * 0.4 + (1 - L) * 0.3 + S * 0.3;
}

export function evaluateEndpoint(metrics: TrafficSignal): "promote" | "rollback" | "stable" {
  const confidence = computeConfidence(metrics);
  if (confidence > MIGRATION_THRESHOLD) return "promote";
  if (confidence < ROLLBACK_THRESHOLD) return "rollback";
  return "stable";
}

// Sandbox Layer: proposal -> validation -> commit -> apply
export function proposeMigration(
  state: EndpointMigrationState, 
  decision: "promote" | "rollback" | "stable"
): EndpointMigrationState {
  // Deep clone to propose safely
  const proposal = { ...state };
  
  if (decision === "rollback") {
    proposal.status = "locked_v1";
    proposal.v1TrafficRatio = 1.0;
    proposal.v2TrafficRatio = 0.0;
  } else if (decision === "promote") {
    // Only propose a shift if we are past the 60s cooldown
    const now = Date.now();
    if (now - proposal.lastShiftAt > 60000) {
      if (proposal.status === "locked_v1") {
        proposal.status = "gradual_migration";
      }
      
      if (proposal.status === "gradual_migration") {
        proposal.v2TrafficRatio = Math.min(1.0, proposal.v2TrafficRatio + 0.05);
        proposal.v1TrafficRatio = Math.max(0.0, proposal.v1TrafficRatio - 0.05);
        
        if (proposal.v2TrafficRatio >= 0.95) {
          proposal.status = "v2_primary";
          proposal.v2TrafficRatio = 1.0;
          proposal.v1TrafficRatio = 0.0;
        }
      }
      proposal.lastShiftAt = now;
    }
  }

  return proposal;
}

export async function validateProposal(proposal: EndpointMigrationState): Promise<boolean> {
  // Global sandbox validation: e.g. check global error rates before committing
  // If we are in "emergency" env mode, block all promotions.
  const ENV = process.env.NODE_ENV || "development";
  const IS_EMERGENCY = process.env.GATEWAY_VALIDATION === "off"; 
  
  if (IS_EMERGENCY && proposal.status !== "locked_v1") {
    console.warn("[SAME SANDBOX] Global emergency blocks promotion proposal.");
    return false; // reject promotion during emergency
  }
  
  return true; // proposal is valid
}

export async function runHeartbeat() {
  const allEndpoints = await store.list();
  
  for (const state of allEndpoints) {
    const metrics = await collectMetrics(state.endpoint);
    const decision = evaluateEndpoint(metrics);
    
    // 1. Propose
    const proposal = proposeMigration(state, decision);
    
    // 2. Validate
    const isValid = await validateProposal(proposal);
    
    // 3. Commit / Apply
    if (isValid) {
      proposal.confidence = computeConfidence(metrics);
      await store.set(proposal.endpoint, proposal);
    }
  }
}
