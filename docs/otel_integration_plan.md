# SIMIS OpenTelemetry Integration Plan

This plan outlines the instrumentation metrics and span definitions.

---

## 1. Trace Spans

*   **`crawl.fetch`**: Spans Crawl4AI/Playwright execution pipelines; tracks latency and status codes.
*   **`signal.extract`**: Tracks NLP/NER claims extraction and semantic embedding generation.
*   **`graph.upsert`**: Tracks node deduplication vector distance evaluations and edge inserts.
*   **`provider.request`**: Measures API call duration and token usage.

---

## 2. Metrics & Instrumentation

*   **`simis.crawler.latency_ms`**: Tracks crawler round-trip times.
*   **`simis.provider.token_count`**: Aggregates LLM input/output tokens.
*   **`simis.db.query_duration_ms`**: Measures database query times.
*   **`simis.queue.backlog_size`**: Monitors queue step backlogs.
