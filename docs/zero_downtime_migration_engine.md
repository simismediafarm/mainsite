# SIMIS Zero-Downtime Migration Engine Spec

This specification defines the system-wide procedures for applying schema and code updates without operational service interruption.

---

## 1. Safety Validation Pipeline

The deployment kernel (`@simis/deploy-kernel`) manages updates via progressive stages:

```
[Deploy Schema SQL] ──> [Shadow DB validation] ──> [Dual-Write Mode]
                                                         │
[Production Promotion] <── [Verify Safety Metrics] <── [Compare Consistency]
```

---

## 2. Dynamic Verification Checks

*   **Static Analysis:** The deployment engine scans SQL text to flag destructive commands (like `DROP TABLE` or `DROP COLUMN`).
*   **Shadow PR Checks:** Validates execution scripts in parallel docker database instances during CI checks.
*   **Automatic Rollbacks:** In case of RLS regression, index overhead spikes, or latency anomalies, the engine restores snapshots automatically.
