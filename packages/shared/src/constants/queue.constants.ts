/**
 * Shared constants for SIMIS D-IOS queue names.
 * Both the API dispatcher and Worker kernel must reference these constants
 * to avoid queue name drift.
 */
export const SIMIS_QUEUE_NAMES = {
  /** Unified command queue — all SIMISCommand events route here first */
  COMMAND: 'simis-command-queue',
  /** Legacy AI enrichment queue (entity/attention/recommendation/demand) */
  AI_ENRICHMENT: 'simis-ai-queue',
  /** Authorization queue */
  AUTHZ: 'simis-authz-queue',
} as const;
