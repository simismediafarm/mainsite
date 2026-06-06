import { AsyncLocalStorage } from 'async_hooks';
import crypto from 'crypto';

export interface SIKContext {
  traceId: string;
  actor?: string;
  source?: string;
  eventType?: string;
}

export const sikStorage = new AsyncLocalStorage<SIKContext>();

/**
 * Hono Middleware to establish SIK Trace Context for every request.
 */
export const honoSikMiddleware = async (c: any, next: any) => {
  const traceId = c.get('traceId') || c.req.header('x-trace-id') || crypto.randomUUID();
  
  // Try to determine event type from request method and path
  let eventType = 'API_MUTATION';
  if (c.req.path.includes('/ingest')) {
    eventType = 'INGESTION';
  } else if (c.req.path.includes('/ai')) {
    eventType = 'AI_PIPELINE';
  }

  const context: SIKContext = {
    traceId,
    actor: c.get('user')?.email || 'system',
    source: c.req.path,
    eventType
  };

  return sikStorage.run(context, next);
};

/**
 * Helper to get current trace ID.
 */
export function getCurrentTraceId(): string | null {
  const store = sikStorage.getStore();
  return store ? store.traceId : null;
}

/**
 * Prisma client extension to enforce event trace invariants on mutations.
 */
export function extendPrismaWithEventInvariant(prismaClient: any) {
  return prismaClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          const isMutation = [
            'create', 'update', 'delete', 'upsert',
            'createMany', 'updateMany', 'deleteMany'
          ].includes(operation);

          if (isMutation && model !== 'EventQueueLog') {
            const context = sikStorage.getStore();
            
            // Allow bypass in test environment or CLI operations
            const isBypassable = process.env.NODE_ENV === 'test' || 
                               process.env.PRISMA_CLI_QUERY_ACTIVE === 'true' ||
                               process.env.SIK_BYPASS === 'true';

            if (!isBypassable) {
              if (!context || !context.traceId) {
                throw new Error(`[Event Trace Invariant Violation] Blocked write operation on "${model}.${operation}". No active traceId found in the execution context (block_write_operation).`);
              }

              if (!context.eventType) {
                throw new Error(`[Event Trace Invariant Violation] Blocked write operation on "${model}.${operation}". Missing eventType in trace context (block_write_operation).`);
              }
              
              // We could also ensure that the EventQueueLog is created.
              // To avoid dual-write complex dependencies, we will log a warning or automatically queue the trace event.
            }
          }

          return query(args);
        }
      }
    }
  });
}
