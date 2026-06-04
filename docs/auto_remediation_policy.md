# SIMIS Auto-Remediation Policy Spec

This specification outlines the permitted automated corrective actions.

---

## 1. Allowed Corrective Actions

1.  **Index Optimization:** Recommend index creation (does not run `CREATE INDEX` dynamically without safe mode approval flag).
2.  **Circuit-Breaker Reset:** Automatically update provider states to `'HALF_OPEN'` in the database when the cooldown expires.
3.  **Queue Re-Balancing:** Automatically requeue stuck crawl jobs (`requeue_stuck_crawl_jobs()`) or workflow steps when leases expire.
4.  **Signal Score Clamping:** Clamps vector metrics to prevent quality drift.

---

## 2. Ingestion Self-Healing Controls

*   **Failure Thresholds:** Pause active ingestion source URL if failures exceed 15.
*   **Auto-Reactivation:** Automatically reactivate paused sources when their failure count resolves to less than 3, and their trust score exceeds 0.60.
