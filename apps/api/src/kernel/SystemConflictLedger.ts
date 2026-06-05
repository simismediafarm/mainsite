import { ArbitrationMode } from "./RiskWeightedModeSelector";

export type KernelDecision = "ACCEPTED" | "REJECTED" | "DEFERRED";

export interface ConflictLedgerEntry {
  readonly entryId: string;
  readonly requestId: string;
  readonly tenantId: string;
  readonly namespace: string;
  readonly riskScore: number;
  readonly modeSelected: ArbitrationMode;
  readonly validationStages: string[];
  readonly decision: KernelDecision;
  readonly rejectionReason?: string;
  readonly timestamp: Date;
}

/**
 * SystemConflictLedger is an append-only in-memory log of all arbitration
 * decisions made by the GlobalArbitrationKernel.
 *
 * INVARIANTS:
 * - Entries are NEVER mutated after appending.
 * - Entries are NEVER deleted.
 * - Order is always chronological insertion order.
 *
 * This is the forensic memory of the kernel. It answers: "What did the
 * kernel decide, when, and why?"
 */
export class SystemConflictLedger {
  private readonly entries: ConflictLedgerEntry[] = [];
  private counter = 0;

  append(entry: Omit<ConflictLedgerEntry, "entryId" | "timestamp">): ConflictLedgerEntry {
    const committed: ConflictLedgerEntry = {
      ...entry,
      entryId: `ledger-${Date.now()}-${++this.counter}`,
      timestamp: new Date()
    };
    // Freeze to enforce immutability
    Object.freeze(committed);
    this.entries.push(committed);
    return committed;
  }

  getAll(): ReadonlyArray<ConflictLedgerEntry> {
    return this.entries;
  }

  getByTenant(tenantId: string): ReadonlyArray<ConflictLedgerEntry> {
    return this.entries.filter(e => e.tenantId === tenantId);
  }

  getByDecision(decision: KernelDecision): ReadonlyArray<ConflictLedgerEntry> {
    return this.entries.filter(e => e.decision === decision);
  }

  size(): number {
    return this.entries.length;
  }
}
