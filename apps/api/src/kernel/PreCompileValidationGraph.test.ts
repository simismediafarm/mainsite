import { describe, it, expect } from "vitest";
import { PreCompileValidationGraph, ArtifactNode } from "./PreCompileValidationGraph";

describe("PreCompileValidationGraph", () => {
  const validator = new PreCompileValidationGraph();

  it("should pass a valid single-tenant dependency graph", () => {
    const nodes: ArtifactNode[] = [
      { artifactId: "a1", tenantId: "acme", namespace: "@acme/button", dependencies: [] },
      { artifactId: "a2", tenantId: "acme", namespace: "@acme/theme", dependencies: ["a1"] }
    ];
    const result = validator.validate(nodes);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("should BLOCK cross-tenant implicit dependency", () => {
    const nodes: ArtifactNode[] = [
      { artifactId: "b1", tenantId: "evil-corp", namespace: "@evil-corp/stolen", dependencies: [] },
      { artifactId: "a1", tenantId: "acme", namespace: "@acme/button", dependencies: ["b1"] }
    ];
    const result = validator.validate(nodes);
    expect(result.valid).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].type).toBe("CROSS_TENANT_DEPENDENCY");
    expect(result.violations[0].sourceArtifactId).toBe("a1");
    expect(result.violations[0].targetArtifactId).toBe("b1");
  });

  it("should BLOCK circular artifact references", () => {
    const nodes: ArtifactNode[] = [
      { artifactId: "a1", tenantId: "acme", namespace: "@acme/a", dependencies: ["a2"] },
      { artifactId: "a2", tenantId: "acme", namespace: "@acme/b", dependencies: ["a3"] },
      { artifactId: "a3", tenantId: "acme", namespace: "@acme/c", dependencies: ["a1"] } // cycle back to a1
    ];
    const result = validator.validate(nodes);
    expect(result.valid).toBe(false);
    const cycleViolations = result.violations.filter(v => v.type === "CIRCULAR_REFERENCE");
    expect(cycleViolations.length).toBeGreaterThan(0);
  });

  it("should detect multiple violations in a single graph", () => {
    const nodes: ArtifactNode[] = [
      { artifactId: "x1", tenantId: "tenant-x", namespace: "@tenant-x/base", dependencies: [] },
      { artifactId: "a1", tenantId: "acme", namespace: "@acme/button", dependencies: ["x1"] }, // cross-tenant
      { artifactId: "a2", tenantId: "acme", namespace: "@acme/theme", dependencies: ["a1"] },
      { artifactId: "a3", tenantId: "acme", namespace: "@acme/layout", dependencies: ["a2"] },
    ];
    const result = validator.validate(nodes);
    expect(result.valid).toBe(false);
    expect(result.violations.some(v => v.type === "CROSS_TENANT_DEPENDENCY")).toBe(true);
  });

  it("should allow a graph with no dependencies (trivially valid)", () => {
    const nodes: ArtifactNode[] = [
      { artifactId: "a1", tenantId: "acme", namespace: "@acme/standalone", dependencies: [] }
    ];
    const result = validator.validate(nodes);
    expect(result.valid).toBe(true);
  });
});
