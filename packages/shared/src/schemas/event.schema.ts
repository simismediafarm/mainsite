import { z } from 'zod';

export const CostContextSchema = z.object({
  estimated_cost_usd: z.number().nonnegative(),
  tokens_in: z.number().int().nonnegative(),
  tokens_out: z.number().int().nonnegative(),
});

export const SimisEventTypeSchema = z.enum([
  'KERNEL_INGRESS_RECEIVED',
  'CONTEXT_VALIDATED',
  'AI_PROVIDER_SELECTED',
  'AI_FALLBACK_TRIGGERED',
  'QSTASH_EVENT_DISPATCHED',
  'RENDER_EXECUTION_STARTED',
  'RENDER_EXECUTION_COMPLETED',
  'COST_LEDGER_WRITTEN',
  'EXECUTION_REPLAY_STORED',
  'KILL_SWITCH_TRIGGERED'
]);

export const SimisEventSourceSchema = z.enum([
  'kernel',
  'ui',
  'worker',
  'cron'
]);

export const SimisEventSchemaV4 = z.object({
  event_id: z.string().uuid(),
  trace_id: z.string().uuid(),
  timestamp: z.string().datetime(),
  source: SimisEventSourceSchema,
  type: SimisEventTypeSchema,
  state_before: z.string().optional(),
  state_after: z.string().optional(),
  payload: z.record(z.string(), z.unknown()),
  user_context: z.record(z.string(), z.unknown()).optional(),
  cost_context: CostContextSchema.optional(),
});

export type SimisEventV4 = z.infer<typeof SimisEventSchemaV4>;
export type CostContext = z.infer<typeof CostContextSchema>;
export type SimisEventType = z.infer<typeof SimisEventTypeSchema>;
export type SimisEventSource = z.infer<typeof SimisEventSourceSchema>;
