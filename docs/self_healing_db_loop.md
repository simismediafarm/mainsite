# SIMIS Self-Healing Database Loop Spec

This document details the database-level feedback and auto-remediation system.

---

## 1. Loop Architecture

The database monitors queries, queue status, and ingestion health, automatically triggering corrective procedures to resolve bottlenecks:

```
[System Health Indicators] ──> [Detection Functions] ──> [Trigger Procedures]
                                                                  │
[Verification Loop] <── [Auto-Remediation Updates] <── [Apply Actions]
```

---

## 2. Ingestion Self-Healing State Machine

Self-healing logic is implemented via PostgreSQL database triggers and cron functions (defined in [008_auto_healing_ingestion_resilience.sql](file:///Users/mac/Downloads/PROYEK/SIMIS/packages/database/migrations/008_auto_healing_ingestion_resilience.sql)):
*   **Error Classification:** Ingestion failures are parsed to extract error types (`timeout`, `network`, `rate_limit`, `parse_error`, `schema_mismatch`).
*   **Circuit-Breaker Triggering:** Source health scores decrease on failure. If consecutive failures exceed 10, the source is paused or disabled.
*   **Adaptive Interval Updates:** Crawl frequency dynamically updates based on success/failure rates, stretching interval delays from 30 minutes to 2 hours under error load to allow proxy recovery.
*   **Stuck Job Reclamation:** Periodic cron routines find and release jobs locked by failed or dead worker nodes.
