import { RecoveryScheduler } from "./recovery_scheduler.js";
import { DLQResolver } from "./dlq_resolver.js";

export class SelfHealingEngine {
  private scheduler = new RecoveryScheduler();
  private dlqResolver = new DLQResolver();

  async tick() {
    // 1. recover deferred jobs
    await this.scheduler.scanAndRecover();

    // 2. resolve dead-letter jobs
    await this.dlqResolver.scanAndRepair();
  }

  start(intervalMs = 2000): ReturnType<typeof setInterval> {
    return setInterval(() => this.tick(), intervalMs);
  }
}
