import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { ArtifactCache, CachedArtifact } from "./ArtifactCache";
import { ArtifactLoader } from "./ArtifactLoader";
import { ArtifactResolver } from "./ArtifactResolver";
import { ThemeInjector } from "./ThemeInjector";
import crypto from "crypto";

describe("Renderer Runtime Contracts - Unit Tests", () => {
  const dummyArtifact: CachedArtifact = {
    cssVariables: {
      "--button-primary-background": "#2563eb",
      "--simis-colors-red-500": "#ef4444",
    },
    componentMappings: {},
    provenance: {
      compiledFromBundleHash: "active_bundle_123",
      compiledAt: "2026-06-05T00:00:00Z",
      compiledBy: "test",
      compilerVersion: "1.0.0",
      compilerHash: "sha256:hash",
      dependencyFingerprint: "fingerprint_abc",
      artifactSignature: crypto
        .createHash("sha256")
        .update("active_bundle_123fingerprint_abcsha256:hash1.0.0")
        .digest("hex"),
      sourceManifest: {
        themeVersionUid: "ver_theme_1",
        tokenVersionUids: [],
        motionVersionUids: [],
        iconVersionUids: [],
        componentStyleVersionUids: [],
      },
    },
  };

  beforeEach(() => {
    ArtifactCache.clear();
    vi.restoreAllMocks();
  });

  describe("ArtifactCache", () => {
    it("should generate correct compound cache key", () => {
      const key = ArtifactCache.generateKey("tenant-1", "workspace-1", "development", "fingerprint_1", "1.0.0");
      expect(key).toBe("tenant-1:workspace-1:development:fingerprint_1:1.0.0");

      const keyNoWorkspace = ArtifactCache.generateKey("tenant-1", undefined, "development", "fingerprint_1", "1.0.0");
      expect(keyNoWorkspace).toBe("tenant-1:default:development:fingerprint_1:1.0.0");
    });

    it("should store and retrieve from cache with default TTL", () => {
      const key = "key1";
      ArtifactCache.set(key, dummyArtifact);
      expect(ArtifactCache.get(key)).toEqual(dummyArtifact);
    });

    it("should expire cache entries after TTL", () => {
      vi.useFakeTimers();
      const key = "key-expire";
      ArtifactCache.set(key, dummyArtifact, 100); // 100ms TTL
      expect(ArtifactCache.get(key)).toEqual(dummyArtifact);

      vi.advanceTimersByTime(150);
      expect(ArtifactCache.get(key)).toBeNull();
      vi.useRealTimers();
    });
  });

  describe("ArtifactLoader", () => {
    it("should throw error when backend request fails", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      global.fetch = fetchMock;

      await expect(
        ArtifactLoader.load("theme-1", {
          tenantId: "t-1",
          environment: "development",
        })
      ).rejects.toThrow("ArtifactLoader: API request failed with status 500");
    });

    it("should load compiled artifact successfully", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          artifactUid: "uid_1",
          compilerVersion: "1.0.0",
          compilerHash: "sha256:hash",
          dependencyFingerprint: "fingerprint_abc",
          payloadHash: "hash_payload",
          cssVariables: { "--button-primary-background": "#2563eb" },
          componentMappings: {},
          provenance: {
            compiledFromBundleHash: "active_bundle_123",
            compiledAt: "2026-06-05T00:00:00Z",
            compiledBy: "test",
            compilerVersion: "1.0.0",
            compilerHash: "sha256:hash",
            dependencyFingerprint: "fingerprint_abc",
            artifactSignature: crypto
              .createHash("sha256")
              .update("active_bundle_123fingerprint_abcsha256:hash1.0.0")
              .digest("hex"),
            sourceManifest: { themeVersionUid: "ver_theme_1" },
          },
        }),
      });
      global.fetch = fetchMock;

      const loaded = await ArtifactLoader.load("theme-1", {
        tenantId: "t-1",
        workspace: "w-1",
        environment: "development",
        token: "jwt_token",
      });

      expect(loaded).not.toBeNull();
      expect(loaded?.cssVariables).toEqual({ "--button-primary-background": "#2563eb" });
      expect(loaded?.provenance.dependencyFingerprint).toBe("fingerprint_abc");
    });
  });

  describe("ArtifactResolver", () => {
    it("should fail-fast if themeId is empty", async () => {
      await expect(
        ArtifactResolver.resolve("", {
          tenantId: "t-1",
          environment: "development",
        })
      ).rejects.toThrow("themeId is required");
    });

    it("should resolve and cache compiled artifact", async () => {
      vi.spyOn(ArtifactLoader, "load").mockResolvedValue(dummyArtifact);

      const resolved = await ArtifactResolver.resolve("theme-1", {
        tenantId: "t-1",
        environment: "development",
      });

      expect(resolved).toEqual(dummyArtifact);

      // Verify it was cached
      const cacheKey = ArtifactCache.generateKey("t-1", undefined, "development", "fingerprint_abc", "1.0.0");
      expect(ArtifactCache.get(cacheKey)).toEqual(dummyArtifact);
    });

    it("should check and match bundle hash priority and reject mismatch", async () => {
      vi.spyOn(ArtifactLoader, "load").mockResolvedValue(dummyArtifact);

      // Correct bundle hash matches dummyArtifact.provenance.compiledFromBundleHash ("active_bundle_123")
      const resolved = await ArtifactResolver.resolve("theme-1", {
        tenantId: "t-1",
        environment: "development",
        activeBundleHash: "active_bundle_123",
      });
      expect(resolved).toEqual(dummyArtifact);

      // Mismatched active bundle hash should throw error immediately (resolution priority policy)
      await expect(
        ArtifactResolver.resolve("theme-1", {
          tenantId: "t-1",
          environment: "development",
          activeBundleHash: "different_bundle_hash",
        })
      ).rejects.toThrow("does not match active bundle hash");
    });
  });

  describe("ThemeInjector Component", () => {
    it("should generate style element with variables prefixed with --simis- namespace", () => {
      const element = ThemeInjector({ artifact: dummyArtifact });
      expect(element.props.id).toContain("simis-theme-ver_theme_1");
      
      const rawHtml = element.props.dangerouslySetInnerHTML.__html;
      // Should format --button-primary-background to --simis-button-primary-background
      expect(rawHtml).toContain("--simis-button-primary-background: #2563eb;");
      // If it already had prefix, it should retain it exactly
      expect(rawHtml).toContain("--simis-colors-red-500: #ef4444;");
      expect(rawHtml).toContain(":root {");
    });
  });
});
