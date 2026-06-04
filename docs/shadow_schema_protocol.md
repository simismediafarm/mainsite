# SIMIS Shadow Schema Protocol Specification

This specification defines the progressive deployment stages.

---

## 1. Dual-Write Verification Stage

Before database migrations are promoted to production, the deployment kernel executes write requests to both the production schema and the parallel shadow schema. It validates query plans and compares result sets to ensure eventual consistency.

---

## 2. Progressive Rollout Strategy

*   **Shadow DB Stage:** Run migration against parallel shadow schema.
*   **Tenant Batches:** Roll out change progressively to a select batch of test tenants (e.g. 5% of organizations).
*   **Validation Window:** Monitor RLS safety alerts for 24 hours.
*   **Production Promotion:** If no anomalies are detected, push migration to production.
