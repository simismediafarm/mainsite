import { Context } from "hono";
import { DesignSystemApplicationService } from "./DesignSystemApplicationService";
import { PromotionCoordinator } from "./promotion/PromotionCoordinator";
import {
  CreateDesignSystemObjectSchema,
  RollbackDesignSystemObjectSchema,
  PromoteDesignSystemObjectSchema,
} from "./DesignSystemSchemas";
import { RegistryContext, RegistryError } from "@simis/registry-core";

export class DesignSystemController {
  constructor(
    private readonly appService: DesignSystemApplicationService,
    private readonly promotionCoordinator: PromotionCoordinator
  ) {}

  private getContext(c: Context): RegistryContext {
    // SECURITY: resolve tenant, workspace, environment, actor from headers or body
    const tenantId = c.req.header("x-tenant-id") || c.req.query("tenantId");
    const workspace = c.req.header("x-workspace") || c.req.query("workspace");
    const environment = (c.req.header("x-environment") || c.req.query("environment") || "development") as any;
    const actorId = c.req.header("x-actor-id") || "anonymous";

    if (!tenantId) {
      throw new RegistryError("VALIDATION_ERROR", "x-tenant-id header or tenantId query is required");
    }

    if (environment && !["development", "staging", "production"].includes(environment)) {
      throw new RegistryError("VALIDATION_ERROR", `Invalid environment: ${environment}`);
    }

    return {
      actorId,
      tenantId,
      workspace: workspace || undefined,
      environment,
      correlationId: c.req.header("x-correlation-id"),
    };
  }

  private handleError(e: any, c: Context) {
    if (e instanceof RegistryError) {
      switch (e.code) {
        case "NOT_FOUND":
          return c.json({ error: e.message, details: e.details }, 404);
        case "VALIDATION_ERROR":
        case "PAYLOAD_INTEGRITY_ERROR":
          return c.json({ error: e.message, details: e.details }, 400);
        case "DEPENDENCY_VIOLATION":
        case "CYCLE_DETECTED":
        case "TENANT_BOUNDARY_VIOLATION":
        case "VERSION_CONSISTENCY_ERROR":
        case "WORKFLOW_VIOLATION":
        case "PROMOTION_REJECTED":
          return c.json({ error: e.message, details: e.details }, 409);
        case "LOCK_ACQUISITION_FAILED":
          return c.json({ error: e.message, details: e.details }, 423);
        default:
          return c.json({ error: e.message, details: e.details }, 500);
      }
    }
    console.error(e);
    return c.json({ error: "Internal Server Error" }, 500);
  }

  async listObjects(c: Context) {
    try {
      const context = this.getContext(c);
      const list = await this.appService.listObjects(context);
      return c.json(list);
    } catch (e: any) {
      return this.handleError(e, c);
    }
  }

  async getObject(c: Context) {
    try {
      const context = this.getContext(c);
      const id = c.req.param("id") as string;
      const obj = await this.appService.getObject(context, id);
      if (!obj) {
        return c.json({ error: `Design system object with id ${id} not found` }, 404);
      }
      return c.json(obj);
    } catch (e: any) {
      return this.handleError(e, c);
    }
  }

  async createDraft(c: Context) {
    try {
      const context = this.getContext(c);
      const body = await c.req.json();
      const parsed = CreateDesignSystemObjectSchema.parse(body);

      const def = await this.appService.createDraft(context, parsed.id, parsed.payload);
      return c.json(def, 201);
    } catch (e: any) {
      return this.handleError(e, c);
    }
  }

  async publish(c: Context) {
    try {
      const context = this.getContext(c);
      const id = c.req.param("id") as string;

      // The param "id" represents definitionUid
      await this.appService.publish(context, id);
      return c.json({ success: true });
    } catch (e: any) {
      return this.handleError(e, c);
    }
  }

  async rollback(c: Context) {
    try {
      const context = this.getContext(c);
      const id = c.req.param("id") as string;
      const body = await c.req.json();
      const parsed = RollbackDesignSystemObjectSchema.parse(body);

      await this.appService.rollback(context, id, parsed.targetVersionNumber);
      return c.json({ success: true });
    } catch (e: any) {
      return this.handleError(e, c);
    }
  }

  async promote(c: Context) {
    try {
      const context = this.getContext(c);
      const id = c.req.param("id") as string;
      const body = await c.req.json();
      const parsed = PromoteDesignSystemObjectSchema.parse(body);

      if (parsed.strategy === "CASCADING_PROMOTION") {
        const manifest = await this.promotionCoordinator.promoteCascading(context, id, parsed.targetEnvironment);
        return c.json({ success: true, manifest });
      } else {
        await this.appService.promote(context, id, parsed.targetEnvironment, parsed.strategy);
        return c.json({ success: true });
      }
    } catch (e: any) {
      return this.handleError(e, c);
    }
  }

  async getArtifact(c: Context) {
    try {
      const context = this.getContext(c);
      const id = c.req.param("id") as string; // themeId

      const artifact = await this.appService.getArtifact(context, id);
      if (!artifact) {
        return c.json({ error: `Compiled artifact for theme ${id} not found` }, 404);
      }

      // Return standard artifact JSON payload
      return c.json({
        artifactUid: artifact.definitionUid,
        compilerVersion: artifact.definition.provenance?.compilerVersion || "1.0.0",
        compilerHash: artifact.definition.provenance?.compilerHash || "",
        dependencyFingerprint: artifact.definition.provenance?.dependencyFingerprint || "",
        payloadHash: artifact.payloadHash,
        cssVariables: artifact.definition.cssVariables || {},
        componentMappings: artifact.definition.componentMappings || {},
        provenance: artifact.definition.provenance || {},
      });
    } catch (e: any) {
      return this.handleError(e, c);
    }
  }

  async getCss(c: Context) {
    try {
      const context = this.getContext(c);
      const id = c.req.param("id") as string; // themeId

      const artifact = await this.appService.getArtifact(context, id);
      if (!artifact) {
        return c.text(`/* Compiled artifact for theme ${id} not found */`, 404);
      }

      const cssVariables = artifact.definition.cssVariables || {};
      let cssText = ":root {\n";
      for (const [key, value] of Object.entries(cssVariables)) {
        cssText += `  ${key}: ${value};\n`;
      }
      cssText += "}\n";

      c.header("Content-Type", "text/css");
      c.header("x-theme-key", id);
      c.header("x-theme-version", artifact.versionNumber.toString());
      
      const artifactSignature = artifact.definition.provenance?.artifactSignature || "";
      c.header("x-artifact-signature", artifactSignature);
      
      // CDN Cache Invalidation Headers
      c.header("ETag", `"${artifactSignature}"`);
      c.header("Cache-Tag", `theme-${id},theme-v${artifact.versionNumber}`);
      c.header("Surrogate-Key", `theme-${id} theme-v${artifact.versionNumber}`);
      
      return c.body(cssText);
    } catch (e: any) {
      return this.handleError(e, c);
    }
  }
}
