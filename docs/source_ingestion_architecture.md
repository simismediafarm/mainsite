# SIMIS Source Ingestion Architecture Spec

This document defines the architectural specifications for the multi-channel distributed crawling mesh and ingestion pipeline.

---

## 1. Crawl Mesh Topology

The crawler runtime is deployed as a distributed mesh of worker nodes communicating via the central Supabase PostgreSQL job queue (`crawl_jobs`).

*   **Primary Crawler:** Crawl4AI worker nodes running inside isolated Docker containers, leveraging headless browsers optimized for LLM readability (markdown output mode).
*   **Fallback Crawler:** Headless Playwright workers deployed locally on secondary machines to handle sites protected by Cloudflare or presenting complex dynamic JS rendering challenges.

---

## 2. Ingestion Flow Pipeline

```
[Inbound Sources]
   ↓
[Crawl Mesh Dispatcher] (crawler-mesh/src/index.ts)
   ↓ (Job lock via SKIP LOCKED)
[Crawl Worker (Crawl4AI / Playwright)]
   ↓ (Content Fetch & Normalization)
[Database Signals Queue] (signals table)
```

---

## 3. Ingestion State Machine

Sources evolve through the following lifecycle states:

```
INCOMING ──> CRAWLED ──> PARSED ──> SCORED ──> ACTIVE ──> ARCHIVED
```

*   **INCOMING:** Newly registered URL; awaits initial safety and trust evaluations.
*   **CRAWLED:** Ingestion workers successfully fetched HTML/text payload.
*   **PARSED:** Signals and entities extracted; metadata inlined.
*   **SCORED:** Novelty, importance, and authority scores computed.
*   **ACTIVE:** Verified source; included in periodic scheduler loops.
*   **ARCHIVED:** Deemed low quality or inactive; removed from active scheduler loops.
