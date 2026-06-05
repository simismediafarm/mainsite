import { z } from "zod";

export const SIMISCommandTypeSchema = z.enum([
  "QUEUE.REPLAY",
  "QUEUE.PAUSE",
  "QUEUE.RESUME",
  "CACHE.INVALIDATE",
  "CACHE.WARMUP",
  "CRAWLER.TRIGGER",
  "ENTITY.REPROCESS",
  "ATTENTION.RECALCULATE",
  "SYSTEM.HEALTHCHECK",
  "TRACE.EXPORT",
  "CONTENT.DRAFT.CREATE",
  "CONTENT.EDIT.OWN",
  "CONTENT.EDIT.ANY",
  "CONTENT.REVIEW",
  "CONTENT.APPROVE",
  "CONTENT.REJECT",
  "CONTENT.PUBLISH.REQUEST",
  "CONTENT.PUBLISH",
  "CONTENT.SCHEDULE",
  "DISTRIBUTION.TRIGGER",
  "AFFILIATE.LINK.ADD"
]);

export type SIMISCommandType = z.infer<typeof SIMISCommandTypeSchema>;

export const SIMISCommandSourceSchema = z.enum(["web", "cli", "ai"]);
export type SIMISCommandSource = z.infer<typeof SIMISCommandSourceSchema>;

export const SIMISCommandModeSchema = z.enum(["dry-run", "execute"]);
export type SIMISCommandMode = z.infer<typeof SIMISCommandModeSchema>;

export const SIMISCommandPrioritySchema = z.enum(["low", "standard", "critical"]);
export type SIMISCommandPriority = z.infer<typeof SIMISCommandPrioritySchema>;

export const SIMISCommandActorContextSchema = z.object({
  sessionType: z.enum(["web", "cli", "ai"]),
  elevationScope: z.string().nullable().optional(),
  deviceTrustLevel: z.enum(["low", "medium", "high"]).optional(),
  ipReputationScore: z.number().optional()
});
export type SIMISCommandActorContext = z.infer<typeof SIMISCommandActorContextSchema>;

export const SIMIS_RBAC_QUEUES = {
  AUTHZ_QUEUE: "simis-authz-queue",
  COMMAND_QUEUE: "simis-command-queue"
};

/**
 * Full SIMISCommand — used internally after the API assigns id, traceId, timestamp.
 */
export const SIMISCommandSchema = z.object({
  id: z.string(),
  source: SIMISCommandSourceSchema,
  actor: z.string(),
  actorContext: SIMISCommandActorContextSchema.optional(),
  type: SIMISCommandTypeSchema,
  scope: z.record(z.string(), z.unknown()),
  mode: SIMISCommandModeSchema,
  priority: SIMISCommandPrioritySchema,
  traceId: z.string(),
  timestamp: z.number().int(),
});

export type SIMISCommand = z.infer<typeof SIMISCommandSchema>;

/**
 * Input schema — client-facing. id, traceId, priority, and timestamp are optional;
 * the API gateway will assign defaults before persisting.
 */
export const SIMISCommandInputSchema = z.object({
  id: z.string().optional(),
  source: SIMISCommandSourceSchema,
  actor: z.string(),
  actorContext: SIMISCommandActorContextSchema.optional(),
  type: SIMISCommandTypeSchema,
  scope: z.record(z.string(), z.unknown()),
  mode: SIMISCommandModeSchema,
  priority: SIMISCommandPrioritySchema.optional(),
  traceId: z.string().optional(),
  timestamp: z.number().int().optional(),
});

export type SIMISCommandInput = z.infer<typeof SIMISCommandInputSchema>;
