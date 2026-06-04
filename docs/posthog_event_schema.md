# SIMIS PostHog Event Schema Specification

This specification defines the schemas for PostHog tracking events.

---

## 1. Custom Events

*   **`ingestion_success`**: Triggered when a crawl job successfully imports content.
*   **`signal_generated`**: Triggered when content normalization resolves new signals.
*   **`provider_route`**: Logs model routing choices and circuit breaker failovers.

---

## 2. Event Properties Schema

Every custom event requires the following base parameters:

```json
{
  "event_type": "string",
  "entity_id": "uuid",
  "organization_id": "uuid",
  "latency_ms": "integer",
  "cost_usd": "number",
  "status": "success | failure"
}
```
