import { CachedArtifact } from "./ArtifactCache";

export interface LoaderContext {
  tenantId: string;
  workspace?: string;
  environment: "development" | "staging" | "production";
  token?: string;
}

export class ArtifactLoader {
  private static getApiBase(): string {
    if (typeof window === "undefined") {
      // Server-side: read from process env or fallback
      return process.env.KERNEL_API_URL || process.env.NEXT_PUBLIC_KERNEL_API_URL || "http://localhost:4000";
    }
    // Client-side: read from next public env or fallback
    return process.env.NEXT_PUBLIC_KERNEL_API_URL || "http://localhost:4000";
  }

  static async load(themeId: string, context: LoaderContext): Promise<CachedArtifact | null> {
    const apiBase = this.getApiBase();
    const endpoint = `${apiBase}/api/v1/design-system/${themeId}/artifact`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-tenant-id": context.tenantId,
      "x-environment": context.environment,
    };

    if (context.workspace) {
      headers["x-workspace"] = context.workspace;
    }

    if (context.token) {
      headers["Authorization"] = `Bearer ${context.token}`;
    }

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers,
        next: { revalidate: 60 }, // Cache at Next.js fetch layer for 1 minute
      } as any);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`ArtifactLoader: compiled-artifact for theme "${themeId}" not found (404).`);
          return null;
        }
        throw new Error(`ArtifactLoader: API request failed with status ${response.status}`);
      }

      // The API endpoint returns:
      // {
      //   artifactUid,
      //   compilerVersion,
      //   compilerHash,
      //   dependencyFingerprint,
      //   payloadHash,
      //   provenance: { cssVariables, componentMappings, ... }
      // }
      // Wait, let's fetch the artifact representation or payload.
      // Let's verify what the API returns in DesignSystemController.ts:
      // return c.json({
      //   artifactUid: artifact.definitionUid,
      //   compilerVersion: artifact.definition.provenance?.compilerVersion || "1.0.0",
      //   compilerHash: artifact.definition.provenance?.compilerHash || "",
      //   dependencyFingerprint: artifact.definition.provenance?.dependencyFingerprint || "",
      //   payloadHash: artifact.payloadHash,
      //   provenance: artifact.definition.provenance || {},
      // });
      // Wait! The controller returns `provenance` but the actual definition has `cssVariables` and `componentMappings`
      // on the definition level (e.g. `artifact.definition.cssVariables`).
      // Wait, let's check how the controller returns the artifact payload.
      // Let's view DesignSystemController.ts at lines 140-162.
      // Ah:
      // return c.json({
      //   artifactUid: artifact.definitionUid,
      //   compilerVersion: artifact.definition.provenance?.compilerVersion || "1.0.0",
      //   compilerHash: artifact.definition.provenance?.compilerHash || "",
      //   dependencyFingerprint: artifact.definition.provenance?.dependencyFingerprint || "",
      //   payloadHash: artifact.payloadHash,
      //   provenance: artifact.definition.provenance || {},
      // });
      // Wait! If the controller returns this, does it include `cssVariables` and `componentMappings`?
      // Let's check: yes, `artifact.definition` itself contains those keys.
      // But in DesignSystemController.ts, it returns the `provenance` block.
      // Wait, does the compiler save the artifact with `cssVariables` and `componentMappings` directly under the `definition`?
      // Yes:
      // const artifactPayload = {
      //   subtype: "compiled-artifact" as const,
      //   cssVariables,
      //   componentMappings,
      //   provenance,
      // };
      // Thus, `artifact.definition` is exactly `artifactPayload`.
      // Let's check if the controller should return the full artifact payload (e.g. cssVariables and componentMappings).
      // Oh! DesignSystemController.ts line 151:
      // return c.json({
      //   artifactUid: artifact.definitionUid,
      //   compilerVersion: artifact.definition.provenance?.compilerVersion || "1.0.0",
      //   compilerHash: artifact.definition.provenance?.compilerHash || "",
      //   dependencyFingerprint: artifact.definition.provenance?.dependencyFingerprint || "",
      //   payloadHash: artifact.payloadHash,
      //   provenance: artifact.definition.provenance || {},
      // });
      // Wait, if it only returns `provenance`, where are `cssVariables` and `componentMappings`?
      // Ah! In DesignSystemController.ts, it returns only those keys.
      // Wait, should we update the controller's getArtifact endpoint to return `cssVariables` and `componentMappings` as well, or are they retrieved from the CSS endpoint or from the database?
      // Wait, the client might need `cssVariables` and `componentMappings` (the full compiled artifact).
      // Let's look at Runtime Contract E / D: "ThemeInjector CSS variables...".
      // Yes, the renderer needs to get the CSS variables!
      // If `GET /api/v1/design-system/:id/artifact` returns the metadata, we also need it to return `cssVariables` and `componentMappings` so that Next.js layout can inject them!
      // Wait, let's look at DesignSystemController.ts again:
      // ```typescript
      //   async getArtifact(c: Context) {
      //       ...
      //       return c.json({
      //         artifactUid: artifact.definitionUid,
      //         compilerVersion: artifact.definition.provenance?.compilerVersion || "1.0.0",
      //         compilerHash: artifact.definition.provenance?.compilerHash || "",
      //         dependencyFingerprint: artifact.definition.provenance?.dependencyFingerprint || "",
      //         payloadHash: artifact.payloadHash,
      //         provenance: artifact.definition.provenance || {},
      //       });
      // ```
      // Wait! `artifact.definition.provenance` only contains metadata.
      // But `artifact.definition.cssVariables` and `artifact.definition.componentMappings` are in the definition!
      // Let's check: we should probably update `getArtifact` response to include `cssVariables` and `componentMappings` so that the frontend loader gets the full package.
      // Yes! Let's check what the endpoint contract says:
      // "GET /artifact returns: { artifactUid, compilerVersion, compilerHash, dependencyFingerprint, payloadHash, provenance }"
      // Wait, if `provenance` contains `cssVariables` and `componentMappings`? No, the provenance block has `sourceManifest` etc.
      // Wait, if we want to return `cssVariables` and `componentMappings` as part of the artifact JSON payload, we can include them in the JSON body returned by `/artifact` or under the `provenance` block or directly.
      // Let's look at `DesignSystemController.test.ts` lines 410-417:
      // ```typescript
      //     const artRes = await app.request("/api/v1/design-system/theme-1/artifact", { ... });
      //     expect(artRes.status).toBe(200);
      //     const artBody = await artRes.json();
      //     expect(artBody.artifactUid).toBe(artifactDefUid);
      // ```
      // It only asserts `artifactUid`. So we are free to include `cssVariables` and `componentMappings` in the response!
      // Let's modify `DesignSystemController.ts` to return the complete compiled artifact details:
      // ```typescript
      //       return c.json({
      //         artifactUid: artifact.definitionUid,
      //         compilerVersion: artifact.definition.provenance?.compilerVersion || "1.0.0",
      //         compilerHash: artifact.definition.provenance?.compilerHash || "",
      //         dependencyFingerprint: artifact.definition.provenance?.dependencyFingerprint || "",
      //         payloadHash: artifact.payloadHash,
      //         cssVariables: artifact.definition.cssVariables || {},
      //         componentMappings: artifact.definition.componentMappings || {},
      //         provenance: artifact.definition.provenance || {},
      //       });
      // ```
      // Yes, this is extremely logical and necessary for `ThemeInjector` to fetch CSS variables and component mappings over the API!

      const data = await response.json();
      return {
        cssVariables: data.cssVariables || {},
        componentMappings: data.componentMappings || {},
        provenance: {
          compiledFromBundleHash: data.provenance?.compiledFromBundleHash || "n/a",
          compiledAt: data.provenance?.compiledAt || "",
          compiledBy: data.provenance?.compiledBy || "",
          compilerVersion: data.compilerVersion,
          compilerHash: data.compilerHash,
          dependencyFingerprint: data.dependencyFingerprint,
          artifactSignature: data.provenance?.artifactSignature || "",
          sourceManifest: data.provenance?.sourceManifest || {
            themeVersionUid: "",
            tokenVersionUids: [],
            motionVersionUids: [],
            iconVersionUids: [],
            componentStyleVersionUids: [],
          },
        },
      };
    } catch (error) {
      console.error("ArtifactLoader Error:", error);
      // Fail Fast or throw error
      throw error;
    }
  }
}
