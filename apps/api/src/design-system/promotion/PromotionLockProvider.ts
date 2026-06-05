export interface PromotionLockProvider {
  /**
   * Acquires a lock for the specified environment, tenant, and workspace.
   * Throws an error if the lock cannot be acquired within the timeout.
   */
  acquireLock(
    environment: string,
    tenantId: string | undefined,
    workspace: string | undefined,
    timeoutMs: number
  ): Promise<void>;

  /**
   * Releases a previously acquired lock.
   */
  releaseLock(
    environment: string,
    tenantId: string | undefined,
    workspace: string | undefined
  ): Promise<void>;
}

export class MemoryPromotionLockProvider implements PromotionLockProvider {
  private locks: Set<string> = new Set();

  private getLockKey(environment: string, tenantId?: string, workspace?: string): string {
    return `${tenantId || "global"}:${workspace || "default"}:${environment}`;
  }

  async acquireLock(
    environment: string,
    tenantId: string | undefined,
    workspace: string | undefined,
    timeoutMs: number = 5000
  ): Promise<void> {
    const key = this.getLockKey(environment, tenantId, workspace);
    
    const startTime = Date.now();
    while (this.locks.has(key)) {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`Failed to acquire promotion lock for ${key} within ${timeoutMs}ms. Another promotion might be in progress.`);
      }
      // wait 50ms before retrying
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    this.locks.add(key);
  }

  async releaseLock(
    environment: string,
    tenantId: string | undefined,
    workspace: string | undefined
  ): Promise<void> {
    const key = this.getLockKey(environment, tenantId, workspace);
    this.locks.delete(key);
  }
}
