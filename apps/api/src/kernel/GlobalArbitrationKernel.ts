import { NamespaceRegistry } from "../marketplace/NamespaceRegistry";
import { MarketplaceArbitrator, PublishRequest, ExistingArtifactVersion } from "../marketplace/MarketplaceArbitrator";
import { PreCompileValidationGraph, ArtifactNode } from "./PreCompileValidationGraph";
import { RiskWeightedModeSelector, RiskInput } from "./RiskWeightedModeSelector";
import { SystemConflictLedger, KernelDecision } from "./SystemConflictLedger";

export interface KernelRequest {
  requestId: string;
  tenantId: string;
  artifactName: string;      // Must be in @tenantId/name format
  requestedVersion: string;
  pipelineId: string;
  timestamp: Date;
  artifactHash: string;
  /** The artifact's own dependencies. Used for pre-compile DAG validation. */
  dependencyGraph: ArtifactNode[];
  existingVersions: ExistingArtifactVersion[];
  riskInput: RiskInput;
}

export interface KernelResult {
  requestId: string;
  decision: KernelDecision;
  resolvedVersion?: string;
  rejectionReason?: string;
  mode: "STRICT" | "ADAPTIVE";
  compositeRiskScore: number;
  validationStages: string[];
}

/**
 * GlobalArbitrationKernel (GAK-X) — The single authoritative entry point for
 * all write operations in the SIMIS ecosystem.
 *
 * Execution Pipeline (in order):
 * 1. Namespace Validation
 * 2. Pre-Compile DAG Validation (catch cross-tenant deps EARLY)
 * 3. Risk Scoring & Mode Selection
 * 4. Marketplace Arbitration (version conflict resolution)
 * 5. Decision logging to SystemConflictLedger
 *
 * HARD BOUNDARIES (enforced by design):
 * - This kernel DOES NOT mutate DSL rules.
 * - This kernel DOES NOT interpret self-modifying logic.
 * - This kernel DOES NOT embed Phase 11 semantics.
 * - This kernel remains a deterministic orchestration layer ONLY.
 */
export class GlobalArbitrationKernel {
  private readonly namespaceRegistry: NamespaceRegistry;
  private readonly validationGraph: PreCompileValidationGraph;
  private readonly modeSelector: RiskWeightedModeSelector;
  private readonly arbitrator: MarketplaceArbitrator;
  private readonly ledger: SystemConflictLedger;

  constructor(ledger: SystemConflictLedger) {
    this.namespaceRegistry = new NamespaceRegistry();
    this.validationGraph = new PreCompileValidationGraph();
    this.modeSelector = new RiskWeightedModeSelector();
    this.arbitrator = new MarketplaceArbitrator();
    this.ledger = ledger;
  }

  async process(request: KernelRequest): Promise<KernelResult> {
    const stages: string[] = [];

    // ── STAGE 1: Namespace Validation ────────────────────────────────────────
    try {
      this.namespaceRegistry.validateOwnership(request.tenantId, request.artifactName);
      stages.push("namespace_validated");
    } catch (e: any) {
      return this.reject(request, stages, `Namespace violation: ${e.message}`);
    }

    // ── STAGE 2: Pre-Compile DAG Validation ──────────────────────────────────
    // This is the key architectural fix: catches cross-tenant dependency conflicts
    // BEFORE compilation is ever allowed to proceed.
    if (request.dependencyGraph.length > 0) {
      const graphResult = this.validationGraph.validate(request.dependencyGraph);
      stages.push("dag_constructed");

      if (!graphResult.valid) {
        const violationSummary = graphResult.violations
          .map(v => `[${v.type}] ${v.message}`)
          .join("; ");
        stages.push("dag_validation_failed");
        return this.reject(request, stages, `Pre-compile DAG violation: ${violationSummary}`);
      }
      stages.push("dag_validated");
    }

    // ── STAGE 3: Risk Scoring & Mode Selection ────────────────────────────────
    const { mode, compositeRiskScore } = this.modeSelector.select(request.riskInput);
    stages.push(`mode_selected:${mode}`);

    // In STRICT mode, apply additional gate: reject if any cross-tenant risk signals are present
    if (mode === "STRICT" && request.riskInput.tenantRiskScore > 0.8) {
      stages.push("strict_mode_high_risk_rejected");
      return this.reject(
        request,
        stages,
        `STRICT mode activated. Tenant risk score ${request.riskInput.tenantRiskScore} exceeds high-risk threshold. Manual review required.`
      );
    }

    // ── STAGE 4: Marketplace Arbitration ─────────────────────────────────────
    let resolvedVersion: string;
    try {
      const publishRequest: PublishRequest = {
        tenantId: request.tenantId,
        artifactName: request.artifactName,
        requestedVersion: request.requestedVersion,
        pipelineId: request.pipelineId,
        timestamp: request.timestamp,
        artifactHash: request.artifactHash
      };
      resolvedVersion = this.arbitrator.arbitrate(publishRequest, request.existingVersions);
      stages.push("arbitration_resolved");
    } catch (e: any) {
      return this.reject(request, stages, `Arbitration failed: ${e.message}`);
    }

    // ── STAGE 5: Commit to Ledger ─────────────────────────────────────────────
    const decision: KernelDecision = mode === "ADAPTIVE" ? "ACCEPTED" : "ACCEPTED";
    this.ledger.append({
      requestId: request.requestId,
      tenantId: request.tenantId,
      namespace: request.artifactName,
      riskScore: compositeRiskScore,
      modeSelected: mode,
      validationStages: stages,
      decision
    });

    return {
      requestId: request.requestId,
      decision,
      resolvedVersion,
      mode,
      compositeRiskScore,
      validationStages: stages
    };
  }

  private reject(
    request: KernelRequest,
    stages: string[],
    rejectionReason: string
  ): KernelResult {
    const riskResult = this.modeSelector.select(request.riskInput);

    this.ledger.append({
      requestId: request.requestId,
      tenantId: request.tenantId,
      namespace: request.artifactName,
      riskScore: riskResult.compositeRiskScore,
      modeSelected: riskResult.mode,
      validationStages: stages,
      decision: "REJECTED",
      rejectionReason
    });

    return {
      requestId: request.requestId,
      decision: "REJECTED",
      rejectionReason,
      mode: riskResult.mode,
      compositeRiskScore: riskResult.compositeRiskScore,
      validationStages: stages
    };
  }
}
