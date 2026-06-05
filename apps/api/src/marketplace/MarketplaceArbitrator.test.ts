import { describe, it, expect } from "vitest";
import { MarketplaceArbitrator, PublishRequest, ExistingArtifactVersion } from "./MarketplaceArbitrator";

describe("MarketplaceArbitrator", () => {
  it("should return requested version if no collisions exist", () => {
    const arbitrator = new MarketplaceArbitrator();
    const req: PublishRequest = {
      tenantId: "tenant-a",
      artifactName: "@tenant-a/button",
      requestedVersion: "1.2.0",
      pipelineId: "pipe-1",
      timestamp: new Date("2026-01-01T10:00:00Z"),
      artifactHash: "hash1"
    };

    expect(arbitrator.arbitrate(req, [])).toBe("1.2.0");
  });

  it("should be idempotent for same pipeline retries", () => {
    const arbitrator = new MarketplaceArbitrator();
    const req: PublishRequest = {
      tenantId: "tenant-a",
      artifactName: "@tenant-a/button",
      requestedVersion: "1.1.0",
      pipelineId: "pipe-1",
      timestamp: new Date("2026-01-01T10:00:00Z"),
      artifactHash: "hash1"
    };

    const existing: ExistingArtifactVersion[] = [{
      version: "1.1.0-a",
      pipelineId: "pipe-1",
      timestamp: new Date("2026-01-01T10:00:00Z"),
      artifactHash: "hash1"
    }];

    expect(arbitrator.arbitrate(req, existing)).toBe("1.1.0-a");
  });

  it("should deterministically assign suffixes for collisions based on timestamp", () => {
    const arbitrator = new MarketplaceArbitrator();
    
    // Existing older promotion
    const existing: ExistingArtifactVersion[] = [{
      version: "1.1.0-a",
      pipelineId: "pipe-old",
      timestamp: new Date("2026-01-01T09:00:00Z"),
      artifactHash: "hash-old"
    }];

    // New promotion coming in later
    const req: PublishRequest = {
      tenantId: "tenant-a",
      artifactName: "@tenant-a/button",
      requestedVersion: "1.1.0",
      pipelineId: "pipe-new",
      timestamp: new Date("2026-01-01T10:00:00Z"),
      artifactHash: "hash-new"
    };

    expect(arbitrator.arbitrate(req, existing)).toBe("1.1.0-b");
  });

  it("should use pipelineId for deterministic sort if timestamps match exactly", () => {
    const arbitrator = new MarketplaceArbitrator();
    const exactTime = new Date("2026-01-01T10:00:00Z");

    const existing: ExistingArtifactVersion[] = [{
      version: "1.1.0-b", // previously arbitrated
      pipelineId: "pipe-xyz", // lexically later
      timestamp: exactTime,
      artifactHash: "hash2"
    }];

    const req: PublishRequest = {
      tenantId: "tenant-a",
      artifactName: "@tenant-a/button",
      requestedVersion: "1.1.0",
      pipelineId: "pipe-abc", // lexically earlier
      timestamp: exactTime,
      artifactHash: "hash1"
    };

    // Because 'pipe-abc' comes before 'pipe-xyz', it gets index 0 -> '-a'
    expect(arbitrator.arbitrate(req, existing)).toBe("1.1.0-a");
  });
});
