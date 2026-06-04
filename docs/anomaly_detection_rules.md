# SIMIS Anomaly Detection Rules Specification

This specification defines the indicators, thresholds, and logging rules for database and operational performance anomalies.

---

## 1. Metric Thresholds

| Metric | Warning Threshold | Critical Threshold | Remediation Trigger |
|---|---|---|---|
| **Query Latency (P95)** | $> 250\text{ms}$ | $> 1000\text{ms}$ | Slow query log entry + pg_stat audit |
| **RLS Overhead** | $> 20\%$ query time | $> 50\%$ query time | Suggest composite index validation |
| **Queue Backlog** | $> 100$ stuck steps | $> 500$ stuck steps | Auto-requeue trigger execution |
| **Circuit Breaker state** | 1 OPEN state | $> 3$ OPEN states | Email alert + fallback routing verification |

---

## 2. Notification Rules

*   **Database Warnings:** Inserted into the `system_alerts` table (severity `'warning'`).
*   **Critical Anomalies:** Inserted into the `system_alerts` table (severity `'critical'`). These alerts notify operators via real-time webhooks (Slack/Telegram) or the MediaFarm control center dashboard.
