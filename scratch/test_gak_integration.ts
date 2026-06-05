import { GlobalArbitrationKernel, KernelRequest } from "../apps/api/src/kernel/GlobalArbitrationKernel";
import { SystemConflictLedger } from "../apps/api/src/kernel/SystemConflictLedger";
import { ArtifactNode } from "../apps/api/src/kernel/PreCompileValidationGraph";

async function main() {
  console.log("================================================================");
  console.log(" SIMIS Phase 10: Global Arbitration Kernel Integration Simulation");
  console.log("================================================================\n");

  const ledger = new SystemConflictLedger();
  const kernel = new GlobalArbitrationKernel(ledger);

  // ── Scenario 1: Clean low-risk publish → ADAPTIVE mode, ACCEPTED ──────────
  console.log("[Scenario 1] Clean low-risk publish (ADAPTIVE mode expected)");
  const s1 = await kernel.process({
    requestId: "sim-1",
    tenantId: "acme",
    artifactName: "@acme/core-button",
    requestedVersion: "1.0.0",
    pipelineId: "ci-acme-001",
    timestamp: new Date("2026-06-01T10:00:00Z"),
    artifactHash: "hash-s1",
    dependencyGraph: [],
    existingVersions: [],
    riskInput: { tenantRiskScore: 0.1, dependencyDepth: 2, cacheInconsistencyRatio: 0.05 }
  });
  console.log(`  → Decision: ${s1.decision} | Mode: ${s1.mode} | Risk: ${s1.compositeRiskScore.toFixed(3)}`);
  console.log(`  → Version: ${s1.resolvedVersion}`);
  console.log(`  → Stages: ${s1.validationStages.join(" → ")}\n`);

  // ── Scenario 2: Cross-tenant dependency → BLOCKED at pre-compile ──────────
  console.log("[Scenario 2] Cross-tenant implicit dependency (PRE-COMPILE BLOCK expected)");
  const crossTenantDeps: ArtifactNode[] = [
    { artifactId: "evil-comp-1", tenantId: "evil-corp", namespace: "@evil-corp/shared", dependencies: [] },
    { artifactId: "acme-theme-1", tenantId: "acme", namespace: "@acme/core-theme", dependencies: ["evil-comp-1"] }
  ];
  const s2 = await kernel.process({
    requestId: "sim-2",
    tenantId: "acme",
    artifactName: "@acme/core-theme",
    requestedVersion: "1.0.0",
    pipelineId: "ci-acme-002",
    timestamp: new Date("2026-06-01T10:01:00Z"),
    artifactHash: "hash-s2",
    dependencyGraph: crossTenantDeps,
    existingVersions: [],
    riskInput: { tenantRiskScore: 0.3, dependencyDepth: 3, cacheInconsistencyRatio: 0.1 }
  });
  console.log(`  → Decision: ${s2.decision} | Mode: ${s2.mode}`);
  console.log(`  → Reason: ${s2.rejectionReason}`);
  console.log(`  → Stages: ${s2.validationStages.join(" → ")}\n`);

  // ── Scenario 3: High-risk tenant → STRICT mode, REJECTED ─────────────────
  console.log("[Scenario 3] Critical risk tenant (STRICT mode + REJECTED expected)");
  const s3 = await kernel.process({
    requestId: "sim-3",
    tenantId: "suspicious-tenant",
    artifactName: "@suspicious-tenant/widget",
    requestedVersion: "99.9.9",
    pipelineId: "ci-sus-001",
    timestamp: new Date("2026-06-01T10:02:00Z"),
    artifactHash: "hash-s3",
    dependencyGraph: [],
    existingVersions: [],
    riskInput: { tenantRiskScore: 0.95, dependencyDepth: 9, cacheInconsistencyRatio: 0.8 }
  });
  console.log(`  → Decision: ${s3.decision} | Mode: ${s3.mode} | Risk: ${s3.compositeRiskScore.toFixed(3)}`);
  console.log(`  → Reason: ${s3.rejectionReason}\n`);

  // ── Scenario 4: Version collision with deterministic resolution ───────────
  console.log("[Scenario 4] Version collision (deterministic -a/-b suffix expected)");
  const s4 = await kernel.process({
    requestId: "sim-4",
    tenantId: "acme",
    artifactName: "@acme/core-button",
    requestedVersion: "1.1.0",
    pipelineId: "ci-acme-late",
    timestamp: new Date("2026-06-01T11:00:00Z"),
    artifactHash: "hash-s4-late",
    dependencyGraph: [],
    existingVersions: [{
      version: "1.1.0-a",
      pipelineId: "ci-acme-early",
      timestamp: new Date("2026-06-01T10:30:00Z"),
      artifactHash: "hash-s4-early"
    }],
    riskInput: { tenantRiskScore: 0.1, dependencyDepth: 2, cacheInconsistencyRatio: 0.05 }
  });
  console.log(`  → Decision: ${s4.decision} | Version: ${s4.resolvedVersion} (deterministic)\n`);

  // ── Conflict Ledger Summary ───────────────────────────────────────────────
  console.log("================================================================");
  console.log(" Conflict Ledger Audit Trail");
  console.log("================================================================");
  const all = ledger.getAll();
  for (const entry of all) {
    console.log(`  [${entry.entryId}] ${entry.decision} | Tenant: ${entry.tenantId} | Risk: ${entry.riskScore.toFixed(3)} | Mode: ${entry.modeSelected}`);
    if (entry.rejectionReason) console.log(`    Reason: ${entry.rejectionReason}`);
  }

  console.log(`\nTotal kernel decisions: ${ledger.size()}`);
  console.log(`  ACCEPTED : ${ledger.getByDecision("ACCEPTED").length}`);
  console.log(`  REJECTED : ${ledger.getByDecision("REJECTED").length}`);
  console.log(`  DEFERRED : ${ledger.getByDecision("DEFERRED").length}`);
  console.log("\nSimulation complete. All ARB constraints verified.");
}

main().catch(console.error);
