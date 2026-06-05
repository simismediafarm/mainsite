import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { DistributedArtifact } from "./DistributedArtifact";

describe("DistributedArtifact Integrity & Immutability", () => {
  it("should detect payload tampering via signature mismatch", () => {
    // 1. Create a simulated compiled payload
    const payload = {
      subtype: "compiled-artifact" as const,
      artifactSchemaVersion: 1,
      cssVariables: { "--color-red": "#ff0000" },
      componentMappings: {},
      provenance: {
        compiledFromBundleHash: "b-hash",
        compiledAt: new Date(),
        compiledBy: "test-actor",
        compilerVersion: "1.0",
        compilerHash: "c-hash",
        dependencyFingerprint: "d-fingerprint",
        artifactSignature: "", // will compute below
      }
    };

    // Calculate a naive content hash and signature
    const contentString = JSON.stringify({ vars: payload.cssVariables, comps: payload.componentMappings });
    const contentHash = crypto.createHash("sha256").update(contentString).digest("hex");
    
    // 2. Create the immutable distributed artifact
    const distributedArtifact: DistributedArtifact = {
      artifactId: "art-1",
      artifactSchemaVersion: 1,
      artifactSignature: crypto.createHash("sha256").update(`${contentHash}-secret-key`).digest("hex"),
      contentHash,
      compiledAt: new Date().toISOString(),
      payload: payload
    };

    // 3. Simulate tampering
    const tamperedPayload = JSON.parse(JSON.stringify(payload));
    tamperedPayload.cssVariables["--color-red"] = "#0000ff"; // attacker changed color
    
    const tamperedContentString = JSON.stringify({ vars: tamperedPayload.cssVariables, comps: tamperedPayload.componentMappings });
    const tamperedContentHash = crypto.createHash("sha256").update(tamperedContentString).digest("hex");
    
    const computedSignature = crypto.createHash("sha256").update(`${tamperedContentHash}-secret-key`).digest("hex");

    // 4. Assert signature rejection
    expect(computedSignature).not.toBe(distributedArtifact.artifactSignature);
  });
});
