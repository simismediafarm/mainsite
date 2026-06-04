# SIMIS Crawler Runtime Design Specification

This document details the operational execution design for crawl nodes in the Distributed Crawler Mesh.

---

## 1. Job Dispatching Logic

Crawl jobs are popped by workers using the workspace package `@simis/crawler-mesh` (`dispatch_crawl_jobs()`):
1. Workers query the `crawl_jobs` queue.
2. Select target rows filtering by status = `'queued'` and time priority.
3. Lock using `node_id` assignment and set a `lease_expires_at` timestamp.

---

## 2. Crawl Execution Flow & Playwright Fallback

```
             [Execute Ingestion Task]
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
     [Crawl4AI Worker]     [Playwright Fallback]
      (Headless browser)    (For proxy rotation &
      (Markdown output)     session-heavy pages)
             │                     │
             └──────────┬──────────┘
                        ▼
             [Extract Signal Payload]
```

---

## 3. Rate Limiting & Proxy Routing

*   **Concurrency limits:** Capped at 5 parallel tasks per domain to prevent triggering target firewall locks.
*   **Proxy Rotation:** Dynamic proxy routing shifts outgoing IPs per task fetch cycle.
*   **Retry Policy:** Failed attempts automatically reschedule with exponential delays (`attempt_count * 30s`), up to 5 max attempts.
