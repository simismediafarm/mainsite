import { describe, it, expect } from "vitest";
import { NamespaceRegistry } from "./NamespaceRegistry";

describe("NamespaceRegistry", () => {
  it("should validate ownership for correctly namespaced artifacts", () => {
    const registry = new NamespaceRegistry();
    expect(registry.validateOwnership("tenant-a", "@tenant-a/core-theme")).toBe(true);
  });

  it("should throw error if tenant tries to access another tenant's namespace", () => {
    const registry = new NamespaceRegistry();
    expect(() => registry.validateOwnership("tenant-b", "@tenant-a/core-theme"))
      .toThrowError("Namespace Violation: Tenant tenant-b cannot publish or access artifact @tenant-a/core-theme. Strict private isolation is enforced.");
  });

  it("should throw error if artifact lacks a namespace prefix", () => {
    const registry = new NamespaceRegistry();
    expect(() => registry.validateOwnership("tenant-a", "core-theme"))
      .toThrowError("Namespace Violation: Tenant tenant-a cannot publish or access artifact core-theme");
  });

  it("should extract tenant ID correctly", () => {
    const registry = new NamespaceRegistry();
    expect(registry.extractTenantId("@acme/button")).toBe("acme");
  });

  it("should throw error when extracting from invalid format", () => {
    const registry = new NamespaceRegistry();
    expect(() => registry.extractTenantId("invalid-format"))
      .toThrowError("Invalid artifact name format: invalid-format");
  });
});
