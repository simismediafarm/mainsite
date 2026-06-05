import { describe, it, expect } from "vitest";
import { RiskWeightedModeSelector } from "./RiskWeightedModeSelector";

describe("RiskWeightedModeSelector", () => {
  const selector = new RiskWeightedModeSelector();

  it("should select STRICT mode when composite risk exceeds 0.65", () => {
    const result = selector.select({
      tenantRiskScore: 0.9,
      dependencyDepth: 8,
      cacheInconsistencyRatio: 0.7
    });
    expect(result.mode).toBe("STRICT");
    expect(result.compositeRiskScore).toBeGreaterThan(0.65);
  });

  it("should select ADAPTIVE mode when composite risk is below threshold", () => {
    const result = selector.select({
      tenantRiskScore: 0.1,
      dependencyDepth: 2,
      cacheInconsistencyRatio: 0.05
    });
    expect(result.mode).toBe("ADAPTIVE");
    expect(result.compositeRiskScore).toBeLessThanOrEqual(0.65);
  });

  it("should be deterministic: same input always produces same output", () => {
    const input = { tenantRiskScore: 0.5, dependencyDepth: 5, cacheInconsistencyRatio: 0.3 };
    const r1 = selector.select(input);
    const r2 = selector.select(input);
    expect(r1.mode).toBe(r2.mode);
    expect(r1.compositeRiskScore).toBe(r2.compositeRiskScore);
  });

  it("should cap dependency depth normalization at MAX (10 levels)", () => {
    const resultAtMax = selector.select({ tenantRiskScore: 0.5, dependencyDepth: 10, cacheInconsistencyRatio: 0.5 });
    const resultBeyondMax = selector.select({ tenantRiskScore: 0.5, dependencyDepth: 9999, cacheInconsistencyRatio: 0.5 });
    expect(resultAtMax.compositeRiskScore).toBe(resultBeyondMax.compositeRiskScore);
  });

  it("should include rationale in result", () => {
    const result = selector.select({ tenantRiskScore: 0.1, dependencyDepth: 1, cacheInconsistencyRatio: 0.1 });
    expect(result.rationale).toBeTruthy();
    expect(result.rationale).toContain("ADAPTIVE");
  });
});
