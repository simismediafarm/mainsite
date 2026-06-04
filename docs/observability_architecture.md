# SIMIS Observability Architecture Spec

This specification defines the observability and telemetry pipeline for SIMIS core engines.

---

## 1. System Trace Propagation

Trace IDs propagate sequentially across components to maintain execution lineage:

```
Ingestion Request (trace_id)
   └── Crawl Job (correlation_id)
          └── Extract Signal (correlation_id)
                 └── Graph Node Insert (trace_id)
```

This causal trace chain enables operators to trace entity graph insertions back to original crawled URLs and proxy execution metadata.

---

## 2. Telemetry Ingestion Layer

*   **Database Tracing:** Monitors query latency, index utilization, and RLS evaluation overhead (using `pg_stat_statements`).
*   **Provider requests:** Evaluates token counts, latency metrics, and API pricing limits on the `provider_requests` table.
*   **User Telemetry:** Leverages PostHog tracker events across edge pages.
