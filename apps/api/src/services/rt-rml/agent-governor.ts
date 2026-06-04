import { RedisStream } from './queue/redis-stream';

export interface AgentExecutionContext {
  agentId: string;
  agentType: "seo" | "content" | "monetization" | "layout" | "healing";
  correlationId: string;
  executionDepth?: number;
}

export class AgentGovernor {
  private static readonly MAX_DEPTH = 1;
  private static activeCycles: Map<string, Set<string>> = new Map(); // tracks agentIds per correlationId
  private static rateLimiter: Map<string, number[]> = new Map(); // agentType -> timestamps of calls

  /**
   * Enforces the AgentExecutionPolicy before starting an agent pipeline task.
   * Throws errors if limits are violated or recursive loops are found.
   */
  static enter(context: AgentExecutionContext): void {
    const correlationId = context.correlationId;
    const agentId = context.agentId;
    const type = context.agentType;

    // 1. Rate Limiting Enforced
    this.enforceRateLimit(type);

    // 2. Initialise cycle registry
    if (!this.activeCycles.has(correlationId)) {
      this.activeCycles.set(correlationId, new Set());
    }

    const currentCycle = this.activeCycles.get(correlationId)!;

    // 3. Execution Depth Check
    const depth = context.executionDepth ?? currentCycle.size;
    if (depth >= this.MAX_DEPTH && currentCycle.size > 0) {
      const msg = `AgentExecutionPolicy Violation: Exceeded execution depth limit of ${this.MAX_DEPTH} for thread ${correlationId}`;
      RedisStream.publish({ type: 'POLICY_VIOLATION', source: 'AgentGovernor', severity: 'HIGH', message: msg, context }).catch(() => {});
      throw new Error(msg);
    }

    // 4. Circular Recursion Prevention (Loop Detection)
    if (currentCycle.has(agentId)) {
      const msg = `AgentExecutionPolicy Violation: Recursive execution loop detected for Agent [${agentId}] in thread ${correlationId}`;
      RedisStream.publish({ type: 'POLICY_VIOLATION', source: 'AgentGovernor', severity: 'CRITICAL', message: msg, context }).catch(() => {});
      throw new Error(msg);
    }

    // Register active execution
    currentCycle.add(agentId);
  }

  /**
   * Marks the execution of an agent cycle complete, releasing it from the active loop registry.
   */
  static exit(context: AgentExecutionContext): void {
    const correlationId = context.correlationId;
    const currentCycle = this.activeCycles.get(correlationId);
    if (currentCycle) {
      currentCycle.delete(context.agentId);
      if (currentCycle.size === 0) {
        this.activeCycles.delete(correlationId);
      }
    }
  }

  /**
   * Cleans old records from the rate limiter map and asserts constraints.
   */
  private static enforceRateLimit(type: string): void {
    const now = Date.now();
    const timeframeMs = 60 * 1000; // 1 minute window
    const maxCallsPerMinute = 30;

    if (!this.rateLimiter.has(type)) {
      this.rateLimiter.set(type, []);
    }

    const history = this.rateLimiter.get(type)!;
    
    // Filter out timestamps outside the current window
    const cutOff = now - timeframeMs;
    const activeHistory = history.filter(t => t > cutOff);
    
    if (activeHistory.length >= maxCallsPerMinute) {
      const msg = `AgentExecutionPolicy RateLimit: Agent group "${type}" throttled. Limit is ${maxCallsPerMinute} requests per minute.`;
      RedisStream.publish({ type: 'RATE_LIMIT_EXCEEDED', source: 'AgentGovernor', severity: 'MEDIUM', message: msg, context: { type } }).catch(() => {});
      throw new Error(msg);
    }

    activeHistory.push(now);
    this.rateLimiter.set(type, activeHistory);
  }
}
