import { describe, it, expect } from "vitest";
import { GlobalArbitrationKernel, KernelRequest } from "./GlobalArbitrationKernel";
import { SystemConflictLedger } from "./SystemConflictLedger";

function makeLedger() { return new SystemConflictLedger(); }

const baseRequest: KernelRequest = {
  requestId: "req-1",
  tenantId: "acme",
  artifactName: "@acme/button",
  requestedVersion: "1.0.0",
  pipelineId: "ci-1",
  timestamp: new Date("2026-01-01T10:00:00Z"),
  artifactHash: "hash-1",
  dependencyGraph: [],
  existingVersions: [],
  riskInput: { tenantRiskScore: 0.1, dependencyDepth: 2, cacheInconsistencyRatio: 0.05 }
};

describe("GlobalArbitrationKernel", () => {
  it("should ACCEPT a clean, low-risk request in ADAPTIVE mode", async () => {
    const kernel = new GlobalArbitrationKernel(makeLedger());
    const result = await kernel.process(baseRequest);

    expect(result.decision).toBe("ACCEPTED");
    expect(result.mode).toBe("ADAPTIVE");
    expect(result.resolvedVersion).toBe("1.0.0");
    expect(result.validationStages).toContain("namespace_validated");
    expect(result.validationStages).toContain("arbitration_resolved");
  });

  it("should REJECT a request with an invalid namespace", async () => {
    const ledger = makeLedger();
    const kernel = new GlobalArbitrationKernel(ledger);
    const result = await kernel.process({
      ...baseRequest,
      requestId: "req-2",
      tenantId: "evil-corp",
      artifactName: "@acme/button" // wrong tenant
    });

    expect(result.decision).toBe("REJECTED");
    expect(result.rejectionReason).toContain("Namespace violation");
    expect(ledger.getByDecision("REJECTED")).toHaveLength(1);
  });

  it("should REJECT at pre-compile stage if cross-tenant dependency is detected", async () => {
    const kernel = new GlobalArbitrationKernel(makeLedger());
    const result = await kernel.process({
      ...baseRequest,
      requestId: "req-3",
      dependencyGraph: [
        { artifactId: "b1", tenantId: "bad-corp", namespace: "@bad-corp/x", dependencies: [] },
        { artifactId: "a1", tenantId: "acme", namespace: "@acme/button", dependencies: ["b1"] }
      ]
    });

    expect(result.decision).toBe("REJECTED");
    expect(result.rejectionReason).toContain("CROSS_TENANT_DEPENDENCY");
    expect(result.validationStages).toContain("dag_constructed");
    expect(result.validationStages).toContain("dag_validation_failed");
  });

  it("should REJECT in STRICT mode when tenant risk score is critically high", async () => {
    const kernel = new GlobalArbitrationKernel(makeLedger());
    const result = await kernel.process({
      ...baseRequest,
      requestId: "req-4",
      riskInput: { tenantRiskScore: 0.95, dependencyDepth: 7, cacheInconsistencyRatio: 0.6 }
    });

    expect(result.decision).toBe("REJECTED");
    expect(result.mode).toBe("STRICT");
    expect(result.rejectionReason).toContain("STRICT mode activated");
  });

  it("should append every decision to the conflict ledger", async () => {
    const ledger = makeLedger();
    const kernel = new GlobalArbitrationKernel(ledger);

    await kernel.process({ ...baseRequest, requestId: "req-5" });
    await kernel.process({ ...baseRequest, requestId: "req-6", tenantId: "evil", artifactName: "@acme/x" });

    expect(ledger.size()).toBe(2);
    expect(ledger.getByDecision("ACCEPTED")).toHaveLength(1);
    expect(ledger.getByDecision("REJECTED")).toHaveLength(1);
  });

  it("should return deterministic version resolution via MarketplaceArbitrator", async () => {
    const kernel = new GlobalArbitrationKernel(makeLedger());
    const result = await kernel.process({
      ...baseRequest,
      requestId: "req-7",
      requestedVersion: "1.1.0",
      existingVersions: [{
        version: "1.1.0-a",
        pipelineId: "ci-old",
        timestamp: new Date("2026-01-01T09:00:00Z"),
        artifactHash: "hash-old"
      }]
    });

    expect(result.decision).toBe("ACCEPTED");
    expect(result.resolvedVersion).toBe("1.1.0-b"); // deterministic suffix
  });
});
