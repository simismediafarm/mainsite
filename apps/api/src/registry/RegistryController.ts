import { RegistryService } from "./RegistryService";
import { CreateRegistryDefinitionSchema, PublishRegistryDefinitionSchema, RollbackRegistryDefinitionSchema, PromoteRegistryDefinitionSchema } from "./RegistrySchemas";
import { Context } from "hono";
import { RegistryError } from "@simis/registry-core";

export class RegistryController {
  constructor(private service: RegistryService) {}

  private handleError(e: any, c: Context) {
    if (e instanceof RegistryError) {
      switch (e.code) {
        case 'NOT_FOUND':
          return c.json({ error: e.message, details: e.details }, 404);
        case 'VALIDATION_ERROR':
        case 'PAYLOAD_INTEGRITY_ERROR':
          return c.json({ error: e.message, details: e.details }, 400);
        case 'DEPENDENCY_VIOLATION':
        case 'CYCLE_DETECTED':
        case 'TENANT_BOUNDARY_VIOLATION':
        case 'VERSION_CONSISTENCY_ERROR':
        case 'WORKFLOW_VIOLATION':
          return c.json({ error: e.message, details: e.details }, 409);
        case 'LOCK_ACQUISITION_FAILED':
          return c.json({ error: e.message, details: e.details }, 423); // Locked
        default:
          return c.json({ error: e.message, details: e.details }, 500);
      }
    }
    console.error(e);
    return c.json({ error: 'Internal Server Error' }, 500);
  }

  async createDraft(c: Context) {
    try {
      const body = await c.req.json();
      const parsed = CreateRegistryDefinitionSchema.parse(body);
      
      const def = await this.service.createDraft(parsed.context, parsed.type, parsed.id, parsed.payload);
      return c.json(def, 201);
    } catch (e: any) {
      return this.handleError(e, c);
    }
  }

  async submitReview(c: Context) {
    try {
      const uid = c.req.param("uid") as string;
      const body = await c.req.json();
      // Assume body has context
      await this.service.submitReview(body.context, uid);
      return c.json({ success: true });
    } catch (e: any) {
      return this.handleError(e, c);
    }
  }

  async publish(c: Context) {
    try {
      const uid = c.req.param("uid") as string;
      const body = await c.req.json();
      const parsed = PublishRegistryDefinitionSchema.parse(body);
      
      await this.service.publish(parsed.context, uid);
      return c.json({ success: true });
    } catch (e: any) {
      return this.handleError(e, c);
    }
  }

  async rollback(c: Context) {
    try {
      const uid = c.req.param("uid") as string;
      const body = await c.req.json();
      const parsed = RollbackRegistryDefinitionSchema.parse(body);
      
      await this.service.rollback(parsed.context, uid, parsed.targetVersionNumber);
      return c.json({ success: true });
    } catch (e: any) {
      return this.handleError(e, c);
    }
  }

  async promote(c: Context) {
    try {
      const uid = c.req.param("uid") as string;
      const body = await c.req.json();
      const parsed = PromoteRegistryDefinitionSchema.parse(body);
      
      await this.service.promote(parsed.context, uid, parsed.targetEnvironment, parsed.strategy);
      return c.json({ success: true });
    } catch (e: any) {
      return this.handleError(e, c);
    }
  }
}
