import { describe, it, expect, vi, beforeEach } from "vitest";
import { ArtifactResolver, ResolverContext } from "./ArtifactResolver";
import { ArtifactCache } from "./ArtifactCache";
import { ArtifactLoader } from "./ArtifactLoader";
import crypto from "crypto";

// Mock the network loader
vi.mock("./ArtifactLoader", () => ({
  ArtifactLoader: {
    load: vi.fn(),
  },
}));

describe("ArtifactResolver Concurrency & SWR", () => {
  const mockContext: ResolverContext = {
    tenantId: "tenant-1",
    workspace: "ws-1",
    environment: "production",
    activeBundleHash: "bundle-hash-1",
  };

  const mockArtifact = {
    cssVariables: { "--color": "red" },
    componentMappings: {},
    provenance: {
      compiledFromBundleHash: "bundle-hash-1",
      compiledAt: "now",
      compiledBy: "test",
      compilerVersion: "1.0.0",
      compilerHash: "hash",
      dependencyFingerprint: "fp",
      artifactSignature: "", // to be filled
      sourceManifest: {
        themeVersionUid: "t1",
        tokenVersionUids: [],
        motionVersionUids: [],
        iconVersionUids: [],
        componentStyleVersionUids: [],
      },
    },
  };

  beforeEach(() => {
    ArtifactCache.clear();
    ArtifactCache.resetMetrics();
    vi.clearAllMocks();

    // calculate signature
    const signature = crypto
      .createHash("sha256")
      .update(
        `${mockArtifact.provenance.compiledFromBundleHash}${mockArtifact.provenance.dependencyFingerprint}${mockArtifact.provenance.compilerHash}${mockArtifact.provenance.compilerVersion}`
      )
      .digest("hex");
    
    mockArtifact.provenance.artifactSignature = signature;
  });

  it("should coalesce 10000 concurrent requests into exactly 1 loader fetch", async () => {
    let activeFetches = 0;
    let maxFetches = 0;

    // We simulate a 50ms network delay to ensure promises are queued
    vi.mocked(ArtifactLoader.load).mockImplementation(async () => {
      activeFetches++;
      if (activeFetches > maxFetches) maxFetches = activeFetches;
      await new Promise((resolve) => setTimeout(resolve, 50));
      activeFetches--;
      return JSON.parse(JSON.stringify(mockArtifact)); // Deep copy to prevent reference mutation
    });

    const requests = Array.from({ length: 10000 }).map(() =>
      ArtifactResolver.resolve("theme-id-1", mockContext)
    );

    const results = await Promise.all(requests);

    // Assert that all 10000 requests got a valid result
    expect(results.length).toBe(10000);
    expect(results[0].cssVariables["--color"]).toBe("red");

    // Assert that the loader was only called ONCE
    expect(ArtifactLoader.load).toHaveBeenCalledTimes(1);
    
    // Assert exactly 1 concurrent fetch was active at most
    expect(maxFetches).toBe(1);

    // Assert metrics
    expect(ArtifactCache.metrics.artifact_cache_refresh).toBe(1);
    expect(ArtifactCache.metrics.artifact_cache_miss).toBe(10000); // 10000 missed initially, but 9999 waited on the coalesced promise
  });

  it("should serve stale data while revalidating in background (SWR) on soft expiry", async () => {
    vi.mocked(ArtifactLoader.load).mockResolvedValue(JSON.parse(JSON.stringify(mockArtifact)));
    
    // Initial fetch to populate cache
    await ArtifactResolver.resolve("theme-id-swr", mockContext);
    expect(ArtifactLoader.load).toHaveBeenCalledTimes(1);

    // Force Soft Expiry by mutating cache directly
    const pointerKey = ArtifactCache.generateLatestPointerKey(
       mockContext.tenantId,
       mockContext.workspace,
       mockContext.environment,
       "theme-id-swr"
    );
    const actualKey = ArtifactCache.getLatestKey(pointerKey)!;
    const entry = ArtifactCache.get(actualKey)!;
    
    // Move soft expiry to the past, but keep hard expiry in future
    entry.softExpiresAt = Date.now() - 10000;
    entry.hardExpiresAt = Date.now() + 10000;
    
    // Simulate a slow network for the background refresh
    let backgroundRefreshResolved = false;
    vi.mocked(ArtifactLoader.load).mockImplementationOnce(async () => {
      await new Promise(r => setTimeout(r, 100));
      backgroundRefreshResolved = true;
      return JSON.parse(JSON.stringify(mockArtifact));
    });

    // Request again, should immediately return STALE data
    const result = await ArtifactResolver.resolve("theme-id-swr", mockContext);
    
    // The background refresh should still be pending
    expect(backgroundRefreshResolved).toBe(false);
    expect(ArtifactCache.metrics.artifact_cache_stale).toBe(1);
    expect(ArtifactCache.metrics.artifact_cache_refresh).toBe(2); // 1 initial, 1 background

    // Wait for the background refresh to complete
    await new Promise(r => setTimeout(r, 150));
    expect(backgroundRefreshResolved).toBe(true);
  });
});
