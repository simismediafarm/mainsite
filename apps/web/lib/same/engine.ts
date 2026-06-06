import { EndpointMigrationState, store } from "./state";
import { TrafficSignal } from "../gateway/telemetry";

const PHASE_EVALUATION_WINDOW_MS = 1000 * 60; // For demo, normally 24 hours

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

// Sandbox Layer: proposal -> validation -> commit -> apply
export function proposeMigration(
  state: EndpointMigrationState, 
  metrics: TrafficSignal
): EndpointMigrationState {
  const proposal = { ...state };
  const confidence = computeConfidence(metrics);
  const now = Date.now();

  // If error rate spikes beyond max threshold, instant rollback to PHASE_0
  if (metrics.errorRateV2 > 0.03) {
    proposal.phase = "PHASE_0";
    proposal.v1TrafficRatio = 1.0;
    proposal.v2TrafficRatio = 0.0;
    proposal.lastShiftAt = now;
    return proposal;
  }

  // Phase progression logic (Requires enough cooldown time)
  if (now - proposal.lastShiftAt > PHASE_EVALUATION_WINDOW_MS) {
    if (proposal.phase === "PHASE_0") {
      proposal.phase = "PHASE_1"; // Shadow
    } 
    else if (proposal.phase === "PHASE_1" && confidence > 0.6) {
      proposal.phase = "PHASE_2"; // Observed Compare
    }
    else if (proposal.phase === "PHASE_2" && confidence > 0.7) {
      proposal.phase = "PHASE_3"; // Dual Run 10%
      proposal.v2TrafficRatio = 0.1;
      proposal.v1TrafficRatio = 0.9;
    }
    else if (proposal.phase === "PHASE_3" && confidence > 0.8) {
      proposal.phase = "PHASE_4"; // Gradual Migration
      proposal.v2TrafficRatio = 0.5;
      proposal.v1TrafficRatio = 0.5;
    }
    else if (proposal.phase === "PHASE_4" && confidence > 0.85) {
      // Step up Traffic
      proposal.v2TrafficRatio += 0.2;
      proposal.v1TrafficRatio -= 0.2;
      
      if (proposal.v2TrafficRatio >= 0.9) {
        proposal.phase = "PHASE_5";
        proposal.v2TrafficRatio = 1.0;
        proposal.v1TrafficRatio = 0.0;
      }
    }
    
    proposal.lastShiftAt = now;
  }

  return proposal;
}

export async function validateProposal(proposal: EndpointMigrationState): Promise<boolean> {
  // Global sandbox validation: e.g. check global error rates before committing
  // If we are in "emergency" env mode, block all promotions.
  const IS_EMERGENCY = process.env.GATEWAY_VALIDATION === "off"; 
  
  if (IS_EMERGENCY && proposal.phase !== "PHASE_0") {
    console.warn("[SAME SANDBOX] Global emergency blocks promotion proposal.");
    return false; // reject promotion during emergency
  }
  
  return true; // proposal is valid
}

export async function runHeartbeat() {
  const allEndpoints = await store.list();
  
  for (const state of allEndpoints) {
    const metrics = await collectMetrics(state.endpoint);
    
    // 1. Propose
    const proposal = proposeMigration(state, metrics);
    
    // 2. Validate
    const isValid = await validateProposal(proposal);
    
    // 3. Commit / Apply
    if (isValid) {
      proposal.confidence = computeConfidence(metrics);
      await store.set(proposal.endpoint, proposal);
    }
  }
}
