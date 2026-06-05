# SIMIS v3.x Audit Criteria & Grading Rubric

## 1. Security (CRITICAL)
- **Role-Based Access Control (RBAC):** Must strictly read from `app_metadata.role` (server-enforced), not `user_metadata` (client-editable).
- **Scope Verification:** Any `SIMISCommand` must validate the actor has authorization over the `target_id` or `scope.id` before mutating.
- **SQL Injection:** All queries must use Prisma parameterized queries or Supabase PostgREST. No raw string interpolation.

## 2. Architecture & Data Integrity (CRITICAL/HIGH)
- **Single Source of Truth:** `EventQueueLog` is the only mutation path. Any layer bypassing this (e.g., legacy SQLite MVP layer) is a critical violation of data integrity.
- **Trace Propagation:** A `traceId` must accompany every event and command, flowing from API to BullMQ to external services.
- **No Direct DB Mutation:** No `prisma.create` / `update` / `delete` outside of the authorized event consumers.

## 3. Reliability & Memory Management (HIGH/MEDIUM)
- **Streams & Connections:** SSE streams must attach `abort` signal listeners to break loops upon client disconnect. Infinite `while(true)` loops cause memory leaks.
- **Queue Cleanup:** BullMQ Workers must explicitly configure `removeOnComplete` and `removeOnFail` to prevent Redis list unbounded growth.
- **Fallback Chains:** AI provider integrations (e.g., OpenRouter -> Gemini -> ChatGPT) must include circuit breakers to prevent cascading timeouts.

## 4. Performance & Scalability (HIGH/MEDIUM)
- **Semantic Caching:** Duplicate LLM inputs should hit the vector cache (`checkSemanticCache`) with pgvector instead of triggering expensive/slow generation tasks.
- **Indexes:** Any column used in `WHERE` clauses (e.g., `status`, `eventType`, `traceId`) must be indexed (`@@index`) to prevent sequential scans under load.

## 5. UI Observability & A11y (MEDIUM)
- **Core Web Vitals:** Control Tower UI should score high on LCP/CLS.
- **Accessibility:** Ensure the UI uses semantic HTML, standard `aria` properties, adequate color contrast, and works with keyboard navigation for administrative panels.
