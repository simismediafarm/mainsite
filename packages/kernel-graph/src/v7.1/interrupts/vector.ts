import { KernelScheduler } from '../scheduler/core';

export enum InterruptType {
  INT_INGESTION_SPIKE = 'INT_INGESTION_SPIKE',
  INT_FRAUD_DETECTED = 'INT_FRAUD_DETECTED',
  INT_NODE_FAILURE = 'INT_NODE_FAILURE',
  INT_BUDGET_EXHAUSTED = 'INT_BUDGET_EXHAUSTED'
}

export class InterruptVector {
  public static trigger(type: InterruptType, payload: any): void {
    console.warn(`[INTERRUPT VECTOR] TRAP: ${type}`, payload);
    const scheduler = KernelScheduler.getInstance();

    switch (type) {
      case InterruptType.INT_FRAUD_DETECTED:
      case InterruptType.INT_NODE_FAILURE:
      case InterruptType.INT_BUDGET_EXHAUSTED:
        // Immediate preemption for severe interrupts
        scheduler.preempt();
        this.handleSevereInterrupt(type, payload);
        break;
      case InterruptType.INT_INGESTION_SPIKE:
        // Adjust queue priorities or throttle, no hard preemption
        this.handleIngestionSpike(payload);
        break;
      default:
        console.error(`[INTERRUPT VECTOR] Unknown interrupt type: ${type}`);
    }
  }

  private static handleSevereInterrupt(type: InterruptType, payload: any) {
    console.warn(`[INTERRUPT HANDLER] Processing ${type}...`);
    // Example: send alert, isolate node, wait for operator, then resume
    // setTimeout(() => KernelScheduler.getInstance().resume(), 5000);
  }

  private static handleIngestionSpike(payload: any) {
    console.log(`[INTERRUPT HANDLER] Scaling crawler resources...`);
  }
}
