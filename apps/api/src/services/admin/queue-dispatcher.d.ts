import { Queue } from 'bullmq';
import { SIMISCommand } from '@simis/shared';
export declare const commandQueue: Queue<{
    id: string;
    source: "web" | "cli" | "ai";
    actor: string;
    type: "QUEUE.REPLAY" | "QUEUE.PAUSE" | "QUEUE.RESUME" | "CACHE.INVALIDATE" | "CACHE.WARMUP" | "CRAWLER.TRIGGER" | "ENTITY.REPROCESS" | "ATTENTION.RECALCULATE" | "SYSTEM.HEALTHCHECK" | "TRACE.EXPORT" | "CONTENT.DRAFT.CREATE" | "CONTENT.EDIT.OWN" | "CONTENT.EDIT.ANY" | "CONTENT.REVIEW" | "CONTENT.APPROVE" | "CONTENT.REJECT" | "CONTENT.PUBLISH.REQUEST" | "CONTENT.PUBLISH" | "CONTENT.SCHEDULE" | "DISTRIBUTION.TRIGGER" | "AFFILIATE.LINK.ADD";
    scope: Record<string, unknown>;
    mode: "dry-run" | "execute";
    priority: "low" | "standard" | "critical";
    traceId: string;
    timestamp: number;
    actorContext?: {
        sessionType: "web" | "cli" | "ai";
        elevationScope?: string | null | undefined;
        deviceTrustLevel?: "low" | "medium" | "high" | undefined;
        ipReputationScore?: number | undefined;
    } | undefined;
}, any, string>;
export declare const authzQueue: Queue<{
    id: string;
    source: "web" | "cli" | "ai";
    actor: string;
    type: "QUEUE.REPLAY" | "QUEUE.PAUSE" | "QUEUE.RESUME" | "CACHE.INVALIDATE" | "CACHE.WARMUP" | "CRAWLER.TRIGGER" | "ENTITY.REPROCESS" | "ATTENTION.RECALCULATE" | "SYSTEM.HEALTHCHECK" | "TRACE.EXPORT" | "CONTENT.DRAFT.CREATE" | "CONTENT.EDIT.OWN" | "CONTENT.EDIT.ANY" | "CONTENT.REVIEW" | "CONTENT.APPROVE" | "CONTENT.REJECT" | "CONTENT.PUBLISH.REQUEST" | "CONTENT.PUBLISH" | "CONTENT.SCHEDULE" | "DISTRIBUTION.TRIGGER" | "AFFILIATE.LINK.ADD";
    scope: Record<string, unknown>;
    mode: "dry-run" | "execute";
    priority: "low" | "standard" | "critical";
    traceId: string;
    timestamp: number;
    actorContext?: {
        sessionType: "web" | "cli" | "ai";
        elevationScope?: string | null | undefined;
        deviceTrustLevel?: "low" | "medium" | "high" | undefined;
        ipReputationScore?: number | undefined;
    } | undefined;
}, any, string>;
export declare class QueueDispatcherService {
    /**
     * Dispatch a validated SIMISCommand to the BullMQ processing pipeline.
     */
    static dispatch(command: SIMISCommand): Promise<string>;
    /**
     * Dispatch a validated SIMISCommand to the Authz processing pipeline.
     */
    static dispatchToAuthz(command: SIMISCommand): Promise<string>;
    private static mapPriority;
}
