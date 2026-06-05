import { z, DesignSystemDefinitionSchema } from "@simis/registry-core";

export const CreateDesignSystemObjectSchema = z.object({
  id: z.string(),
  payload: DesignSystemDefinitionSchema,
});

export const PublishDesignSystemObjectSchema = z.object({
  // Optional, context contains the actor information
});

export const RollbackDesignSystemObjectSchema = z.object({
  targetVersionNumber: z.number().int().positive(),
});

export const PromoteDesignSystemObjectSchema = z.object({
  targetEnvironment: z.enum(["development", "staging", "production"]),
  strategy: z.enum(["STRICT_REJECTION", "CASCADING_PROMOTION"]),
});
