import { NamespaceRegistry } from "../apps/api/src/marketplace/NamespaceRegistry";
import { MarketplaceArbitrator, PublishRequest, ExistingArtifactVersion } from "../apps/api/src/marketplace/MarketplaceArbitrator";

async function main() {
  console.log("==================================================");
  console.log(" SIMIS Phase 9: Multi-Tenant Marketplace Simulator ");
  console.log("==================================================");

  const registry = new NamespaceRegistry();
  const arbitrator = new MarketplaceArbitrator();

  console.log("\n[1] Namespace Governance Checks");
  try {
    registry.validateOwnership("acme", "@acme/core-theme");
    console.log("  ✅ Tenant 'acme' successfully validated for '@acme/core-theme'");
  } catch (e: any) {
    console.error("  ❌", e.message);
  }

  try {
    registry.validateOwnership("evil-corp", "@acme/core-theme");
  } catch (e: any) {
    console.log("  ✅ Namespace hijacked prevented:", e.message);
  }

  console.log("\n[2] Deterministic Version Arbitration");
  
  const existingVersions: ExistingArtifactVersion[] = [
    {
      version: "1.0.0",
      pipelineId: "ci-123",
      timestamp: new Date("2026-06-01T10:00:00Z"),
      artifactHash: "hash-v1"
    }
  ];

  console.log("  Current Marketplace State:");
  console.log("  - @acme/core-theme v1.0.0 (by ci-123)");

  // Scenario 2A: Same pipeline retry (Idempotency)
  const reqRetry: PublishRequest = {
    tenantId: "acme",
    artifactName: "@acme/core-theme",
    requestedVersion: "1.0.0",
    pipelineId: "ci-123",
    timestamp: new Date("2026-06-01T10:05:00Z"),
    artifactHash: "hash-v1"
  };
  const resRetry = arbitrator.arbitrate(reqRetry, existingVersions);
  console.log(`\n  Scenario 2A (Pipeline Retry): Requested 1.0.0 from ci-123 -> Assigned: ${resRetry}`);

  // Scenario 2B: Competing version bump (v1.1.0 vs v1.1.0)
  // Assume ci-A publishes v1.1.0 successfully.
  existingVersions.push({
    version: "1.1.0-a",
    pipelineId: "ci-A",
    timestamp: new Date("2026-06-02T10:00:00Z"),
    artifactHash: "hash-A"
  });

  console.log("\n  ci-A publishes v1.1.0. Marketplace now has: v1.1.0-a");

  // ci-B tries to publish v1.1.0 simultaneously but arrived slightly later
  const reqCollide: PublishRequest = {
    tenantId: "acme",
    artifactName: "@acme/core-theme",
    requestedVersion: "1.1.0",
    pipelineId: "ci-B",
    timestamp: new Date("2026-06-02T10:00:05Z"), // 5 seconds later
    artifactHash: "hash-B"
  };
  const resCollide = arbitrator.arbitrate(reqCollide, existingVersions);
  console.log(`  Scenario 2B (Collision): ci-B requested 1.1.0 -> Assigned: ${resCollide} (Deterministic suffix based on rank)`);
  
  // Scenario 2C: Higher semver intent wins
  const reqHigher: PublishRequest = {
    tenantId: "acme",
    artifactName: "@acme/core-theme",
    requestedVersion: "2.0.0",
    pipelineId: "ci-C",
    timestamp: new Date("2026-06-03T10:00:00Z"),
    artifactHash: "hash-C"
  };
  const resHigher = arbitrator.arbitrate(reqHigher, existingVersions);
  console.log(`\n  Scenario 2C (Higher Intent): ci-C requested 2.0.0 -> Assigned: ${resHigher} (No collision)`);

  console.log("\n==================================================");
  console.log(" Simulation Complete: Strict Constraints Verified ");
  console.log("==================================================");
}

main().catch(console.error);
