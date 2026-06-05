import { describe, it, expect } from "vitest";
import { ContentIntegrity } from "../core/ContentIntegrity";

describe("BundleHashContracts - bundleHash verification", () => {
  it("identical bundle inputs -> identical hash", () => {
    const depsA = [
      { versionUid: "v1", dependencyMode: "pinned" },
      { versionUid: "v2", dependencyMode: "floating" }
    ];
    const depsB = [
      { versionUid: "v1", dependencyMode: "pinned" },
      { versionUid: "v2", dependencyMode: "floating" }
    ];

    const hashA = ContentIntegrity.computeBundleHash(depsA);
    const hashB = ContentIntegrity.computeBundleHash(depsB);
    expect(hashA).toBe(hashB);
  });

  it("pinned vs floating -> different hash", () => {
    const depsA = [
      { versionUid: "v1", dependencyMode: "pinned" }
    ];
    const depsB = [
      { versionUid: "v1", dependencyMode: "floating" } // changed pinned to floating
    ];

    const hashA = ContentIntegrity.computeBundleHash(depsA);
    const hashB = ContentIntegrity.computeBundleHash(depsB);
    expect(hashA).not.toBe(hashB);
  });

  it("versionUid change -> different hash", () => {
    const depsA = [
      { versionUid: "v1", dependencyMode: "pinned" }
    ];
    const depsB = [
      { versionUid: "v2", dependencyMode: "pinned" } // changed versionUid
    ];

    const hashA = ContentIntegrity.computeBundleHash(depsA);
    const hashB = ContentIntegrity.computeBundleHash(depsB);
    expect(hashA).not.toBe(hashB);
  });

  it("bundleHash deterministic across executions", () => {
    const deps = [
      { versionUid: "v2", dependencyMode: "floating" },
      { versionUid: "v1", dependencyMode: "pinned" }
    ];

    const run1 = ContentIntegrity.computeBundleHash(deps);
    const run2 = ContentIntegrity.computeBundleHash(deps);
    expect(run1).toBe(run2);
  });
});
