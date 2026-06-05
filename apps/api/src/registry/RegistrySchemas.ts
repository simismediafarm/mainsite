import { z } from "zod";

export const RegistryContextSchema = z.object({
  actorId: z.string().uuid(),
  tenantId: z.string().optional(),
  workspace: z.string().optional(),
  environment: z.enum(["development", "staging", "production"]),
  correlationId: z.string()
});

export const CreateRegistryDefinitionSchema = z.object({
  id: z.string(),
  type: z.enum(["component", "layout", "page", "schema", "setting", "design-system", "seo", "workflow"]),
  payload: z.record(z.string(), z.any()),
  context: RegistryContextSchema
});

export const PublishRegistryDefinitionSchema = z.object({
  context: RegistryContextSchema
});

export const RollbackRegistryDefinitionSchema = z.object({
  targetVersionNumber: z.number().int().positive(),
  context: RegistryContextSchema
});

export const PromoteRegistryDefinitionSchema = z.object({
  targetEnvironment: z.enum(["development", "staging", "production"]),
  strategy: z.enum(["STRICT_REJECTION", "CASCADING_PROMOTION"]).default("STRICT_REJECTION"),
  context: RegistryContextSchema
});
