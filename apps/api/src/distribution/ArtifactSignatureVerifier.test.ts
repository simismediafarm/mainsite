import { describe, it, expect, vi } from "vitest";
import { ArtifactSignatureVerifier } from "./ArtifactSignatureVerifier";
import { ContentIntegrity } from "@simis/registry-core";

describe("ArtifactSignatureVerifier", () => {
  it("should return true when signature matches payload hash", () => {
    vi.spyOn(ContentIntegrity, "verifyPayloadHash").mockReturnValue(true);

    const payload = { test: "data" };
    const isValid = ArtifactSignatureVerifier.verify(payload, "valid-signature");
    
    expect(isValid).toBe(true);
    expect(ContentIntegrity.verifyPayloadHash).toHaveBeenCalledWith(payload, "valid-signature");
  });

  it("should return false when signature does not match payload hash", () => {
    vi.spyOn(ContentIntegrity, "verifyPayloadHash").mockReturnValue(false);

    const payload = { test: "invalid-data" };
    const isValid = ArtifactSignatureVerifier.verify(payload, "invalid-signature");
    
    expect(isValid).toBe(false);
  });

  it("should return false when signature header is missing", () => {
    vi.spyOn(ContentIntegrity, "verifyPayloadHash");

    const payload = { test: "data" };
    const isValid = ArtifactSignatureVerifier.verify(payload, "");
    
    expect(isValid).toBe(false);
    expect(ContentIntegrity.verifyPayloadHash).not.toHaveBeenCalled();
  });
});
