---
name: simis-system-audit
description: >-
  Full-system audit skill for SIMIS Unified Control Tower (v3.x). Performs
  architecture consistency review, redundancy detection, RBAC security audit,
  performance bottleneck analysis, observability completeness check,
  Core Web Vitals / LCP / a11y audit for the Web UI, database schema validation
  against Supabase/Postgres best practices, and AI advisory layer isolation
  verification. Produces a structured issue catalog with severity scoring,
  risk heatmap, and prioritized actionable backlog. READ-ONLY — no mutations.
  Trigger when user requests: system audit, architecture review, pre-production
  validation, risk analysis, consistency check, or any phrase like
  "audit the codebase", "check system health", or "review architecture".
---

# SIMIS Unified Control Tower — System Audit Skill

## Overview

This skill performs a **comprehensive, read-only** system audit across the full
SIMIS v3.x monorepo. It covers all 9 audit dimensions defined in the v3.1
blueprint and produces a structured JSON + Markdown report with:

- **Executive summary** (health score 0–100, critical violations, top risks)
- **Issue catalog** (severity, category, file reference, root cause, fix)
- **System flow graph** (dependency map of all layers)
- **Actionable backlog** (execution-ready, critical-first)
- **Risk heatmap** (5 dimensions: data integrity, reliability, scalability,
  security, observability)

## Dependencies

| Skill | Role in this audit |
|-------|--------------------|
| `a11y-debugging` | Web UI accessibility audit (ARIA, heading hierarchy, contrast, keyboard navigation, tap targets) |
| `debug-optimize-lcp` | Core Web Vitals & LCP subpart analysis for `/admin` control tower UI |
| `troubleshooting` | DevTools connection validation before browser-based audits |
| `supabase` | Supabase/Postgres security checklist (RLS, user_metadata danger, SECURITY DEFINER) |
| `supabase-postgres-best-practices` | Schema audit: missing indexes, slow-path queries, connection pooling |

## Quick Start

```
Audit the entire SIMIS system for architecture violations, security gaps,
and performance bottlenecks. Produce a full issue catalog and risk heatmap.
```

The agent will execute all 7 phases below in order.

---

## Workflow

### Phase 1 — Repository Scan & Module Map

**Goal**: Build a complete dependency graph of all active modules.

1. Run `find apps packages -name "*.ts" -not -path "*/node_modules/*" | sort`
   to enumerate all source files.
2. Map the four control surfaces:
   - `apps/api/src/routers/` — HTTP gateway layer
   - `apps/worker/src/queue/` — BullMQ processing layer
   - `apps/cli/src/` — Terminal CLI layer
   - `apps/web/app/` — Next.js UI layer
3. Identify all packages imported from `packages/`:
   - `@simis/shared` — Command schema + queue constants
   - `@simis/ai-cache` — Redis snapshot cache
   - `@simis/ai-router` — Multi-provider LLM routing
   - `@simis/kernel-graph`, `@simis/kernel-healing`, `@simis/kernel-theorem` — OS kernel layers
4. Record any orphan modules (imported nowhere, or importing non-existent packages).

**Key files to read**:
- `apps/api/src/index.ts` — What routes are actually mounted?
- `apps/worker/src/ai.worker.ts` — What queues are actually listened to?
- `pnpm-workspace.yaml` — What packages exist in the workspace?

---

### Phase 2 — Architecture Contract Extraction

**Goal**: Extract the canonical contracts and verify all layers respect them.

#### 2.1 SIMISCommand Contract
Read `packages/shared/src/schemas/command.schema.ts`. Extract:
- All `SIMISCommandType` enum values
- Required fields: `id`, `source`, `actor`, `type`, `scope`, `mode`, `priority`, `traceId`, `timestamp`
- Input vs Full schema distinction

Verify that ALL of the following use `SIMISCommandInputSchema.safeParse()`:
- `apps/api/src/routers/admin/command.ts` (POST /api/admin/command)
- `apps/cli/src/index.ts` (CLI dispatch functions)

**VIOLATION CHECK**: Any route that accepts mutations without Zod validation
against `SIMISCommandSchema` is a `NO_DIRECT_DATABASE_MUTATION` violation.

#### 2.2 Queue Name Contract
Read `packages/shared/src/constants/queue.constants.ts`. Verify:
- `apps/api/src/services/admin/queue-dispatcher.ts` uses `SIMIS_QUEUE_NAMES.COMMAND`
- `apps/worker/src/ai.worker.ts` listens to `SIMIS_QUEUE_NAMES.COMMAND` and `SIMIS_QUEUE_NAMES.AI_ENRICHMENT`
- No hardcoded queue name strings exist anywhere in the codebase

Search with: `grep -r "simis-ai-queue\|SIMIS_COMMAND_QUEUE" apps packages --include="*.ts"`

#### 2.3 TraceId Propagation Contract
Every event must carry a `traceId`. Verify:
- API gateway assigns `trace_${uuidv4()}` if missing
- `EventQueueLog.traceId` is written for every command
- Worker logs `traceId` at start and end of processing
- `GET /api/admin/trace/:traceId` can reconstruct the full DAG

Search with: `grep -rn "traceId" apps/worker/src apps/api/src/routers/admin`

#### 2.4 RBAC Contract
Read `apps/api/src/core/permission_guard.ts`:
- Note the `ACTION_POLICY_MATRIX`
- **CRITICAL SECURITY CHECK**: Line 33–36 uses `user.user_metadata.role` for
  RBAC decisions. Per **Supabase security guidelines**, `user_metadata` is
  **user-editable** and MUST NOT be used for authorization. This is a critical
  vulnerability — roles must be stored in `app_metadata` / `raw_app_meta_data`.
- Verify no route bypasses `PermissionGuard.verify()` for destructive actions

#### 2.5 AI Advisory Isolation
Read `apps/api/src/services/admin/ai-advisor.service.ts`. Verify:
- No calls to `QueueDispatcherService.dispatch()`
- No calls to `prisma.create()`, `prisma.update()`, `prisma.delete()`
- Only `prisma.findMany()`, `prisma.count()` are used

---

### Phase 3 — Redundancy & Deprecation Detection

**Goal**: Find duplicate logic, dead code, and deprecated patterns.

#### 3.1 Dual Admin Router Detection (CRITICAL)
The codebase has **two admin routers** that must be compared:
- `apps/api/src/routers/admin.ts` — **LEGACY** (v1/v2 era, uses `ControlOrchestrator`, not `SIMISCommand`)
- `apps/api/src/routers/admin/` directory — **v3.1 NEW** (`SIMISCommand`-based, Command+Metrics+Trace)

Check `apps/api/src/index.ts` to see which one(s) are mounted:
```bash
grep -n "admin" apps/api/src/index.ts
```

If the legacy `admin.ts` is mounted alongside the new `admin/index.ts`, this creates:
- Duplicate mutation entry points (violates `ALL_MUTATIONS_VIA_EVENTQUEUELOG`)
- Route namespace collision risk (`/api/v2/admin` vs `/api/admin`)
- Inconsistent audit trail (legacy uses `ControlOrchestrator.logAudit` = console.log only)

#### 3.2 SQLite vs PostgreSQL Dual Database (HIGH RISK)
Search for SQLite usage:
```bash
grep -rn "sqlite_db\|better-sqlite3\|from '../store/sqlite" apps/api/src --include="*.ts"
```

If `apps/api/src/store/sqlite_db.ts` exists and is imported by:
- `apps/api/src/routers/mvp.ts` (POST /post creates posts directly to SQLite)
- `apps/api/src/services/ingestion.ts`, `feed_engine.ts`, etc.

This means the MVP router layer bypasses PostgreSQL entirely and writes to a
**local SQLite file**, which is invisible to `EventQueueLog`. This is the most
significant architectural split in the system.

#### 3.3 Event Bus Redundancy
`apps/api/src/core/event_bus.ts` uses Node.js `EventEmitter` (in-process only).
`apps/worker/src/ai.worker.ts` uses BullMQ via Redis (cross-process, persistent).
These are parallel event propagation systems with different guarantees:
- EventEmitter: ephemeral, in-memory, no replay, no audit trail
- BullMQ/EventQueueLog: persistent, replayable, traceable

Check if both are used for the same event types (e.g., `CONTENT_UPDATED`
emitted via EventBus but never reaches BullMQ worker).

#### 3.4 AI Cache `checkSemanticCache` Stub
`packages/ai-cache/src/cache.ts` line 44–51: `checkSemanticCache()` always
returns `null` — it's a placeholder with a TODO comment. This means the
semantic cache is completely non-functional, and every AI call bypasses it.
Calculate the cost impact: every entity extraction, attention processing, and
recommendation generation hits the LLM provider with no semantic deduplication.

#### 3.5 Orphaned Old Admin Router Routes
`apps/api/src/routers/admin.ts` contains:
- `PUT /ranking/weights` — mutates in-memory `globalRankingWeights` (not persisted, resets on restart)
- `GET /telemetry/stream` — SSE loop with hardcoded mock data (no Redis wiring)
- `GET /dlq` — hardcoded stub data (not reading from actual dead_letter_queue table)
- `POST /dlq/retry` — no-op stub

These must be flagged as `DEPRECATED_STUB` and migrated to `SIMISCommand` before production.

---

### Phase 4 — Bug & Risk Analysis

**Goal**: Identify runtime failure modes.

#### 4.1 SSE Infinite Loop (CRITICAL - Memory Leak)
`apps/api/src/routers/admin.ts` line 170–189:
```typescript
while (true) {
  await new Promise(r => setTimeout(r, 3000));
  await stream.writeSSE({...});
}
```
There is **no abort signal handler** to break this loop when the client
disconnects. Every SSE connection leaks a permanent timer and a stream reference.
Under moderate load this will OOM the API process.

Compare to the correct pattern in `apps/api/src/routers/mvp.ts` lines 167–180
which properly uses `c.req.raw.signal.aborted` and `signal.addEventListener('abort')`.

#### 4.2 RBAC Bypass via `user_metadata` (CRITICAL - Security)
`apps/api/src/core/permission_guard.ts` lines 33–36 reads role from
`user.user_metadata.role`. Per Supabase guidelines, `raw_user_meta_data` is
user-editable — any authenticated user can set `user_metadata.role = "admin"`
client-side and escalate privileges. Must use `app_metadata` / `raw_app_meta_data`.

#### 4.3 BullMQ `commandWorker` — No Stale Job Cleanup
`apps/worker/src/ai.worker.ts` creates `commandWorker` with `concurrency: 5`
but no `removeOnComplete` or `removeOnFail` options. In BullMQ, completed/failed
jobs accumulate indefinitely in Redis, eventually consuming all memory.
Recommended: `removeOnComplete: { count: 1000 }`, `removeOnFail: { count: 500 }`.

#### 4.4 AuditLog is Console.log Only (HIGH - Data Integrity)
`apps/api/src/core/orchestrator.ts` line 74–79: `logAudit()` only does
`console.log(...)` with a comment "In a real application, insert this into
control_audits table". This audit trail is lost on restart. There is no
`control_audits` table in `schema.prisma`.

#### 4.5 Cache Stampede Risk (MEDIUM)
`packages/ai-cache/src/cache.ts`: no mutex or lock mechanism around
`getSnapshot` + `saveSnapshot`. Under concurrent requests for the same
`inputHash`, multiple processes will simultaneously miss cache and trigger
redundant LLM calls before any of them has finished writing. Use Redis `SETNX`
or a distributed lock pattern.

#### 4.6 AI Router Quota Reset Race Condition (MEDIUM)
`packages/ai-router/src/router.ts` lines 82–88: `incrementQuotaUsage()` uses
`INCRBY` then `EXPIRE`. Between these two Redis commands, a concurrent worker
can read the key without the TTL being set, leading to a key that never expires.
Fix: use `SET key value EX 86400 NX` or Lua script for atomicity.

#### 4.7 LLM Fallback Chain — No Circuit Breaker (MEDIUM)
`packages/ai-router/src/router.ts` defines fallback arrays like
`["gemini", "chatgpt_tactical", "cache"]` but there is no circuit breaker to
short-circuit a provider that is consistently failing. If Gemini is down,
every task will attempt Gemini first, wait for timeout, then try the next
provider — causing cascading latency.

---

### Phase 5 — Database Schema Audit

**Goal**: Validate `prisma/schema.prisma` against real usage patterns.

Apply `supabase-postgres-best-practices` skill for each check:

1. **Missing indexes**: Check `EventQueueLog` — `status` field is filtered
   frequently (`WHERE status = 'QUEUED'`) but has no `@@index([status])`.
   Add: `@@index([status])`.

2. **`globalRankingWeights` not persisted**: The PUT endpoint in legacy admin.ts
   mutates an in-memory object. There is no `RankingWeights` table. If the API
   process restarts, all weight changes are lost.

3. **`control_audits` table missing**: Referenced in `orchestrator.ts` comment
   but not in schema. All audit logs are lost.

4. **`dead_letter_queue` table missing**: Referenced in admin.ts DLQ comment but
   not in schema. DLQ is currently hardcoded stub data.

5. **`LLMCallLog.cost` type**: `Float` in Prisma — for financial calculations,
   use `Decimal` (mapped to `NUMERIC` in Postgres) to avoid floating-point
   precision errors.

6. **`IntelligenceSnapshot.confidence` default**: `@default(0)` — a 0 confidence
   score is indistinguishable from "not computed yet" vs "truly 0 confidence".
   Use `Int?` (nullable) with NULL meaning uncomputed.

---

### Phase 6 — Web UI Audit (a11y, LCP, Core Web Vitals)

**Goal**: Audit `apps/web/app/admin/page.tsx` for accessibility, performance,
and SEO compliance.

#### 6.1 Activate `troubleshooting` skill
Ensure Chrome DevTools MCP is reachable before browser audits.

#### 6.2 Activate `a11y-debugging` skill
Navigate to `http://localhost:3000/admin`:
1. Run Lighthouse accessibility audit
2. Check `take_snapshot` for heading hierarchy (ensure single `<h1>`)
3. Verify all interactive buttons have accessible names (no icon-only unlabeled buttons)
4. Check color contrast on dark/light panels
5. Verify keyboard navigation works through Operations Center controls

Known issues to verify in `admin/page.tsx`:
- Multiple `<h2>` elements without a preceding `<h1>` — check if page layout
  provides an `<h1>` or if the component needs one
- Buttons labeled "Pause Workers" and "Replay Failed" — verify these have
  `aria-label` or visible text is sufficient
- Dry-Run toggle `<button>` has no accessible role or `aria-checked` for screen readers
- `<svg>` in Trace Explorer section needs `aria-hidden="true"` if decorative

#### 6.3 Activate `debug-optimize-lcp` skill
Run performance trace on `/admin`:
1. Identify LCP element (likely the `<h1>` text or first card component)
2. Check for render-blocking resources
3. Verify no lazy-loaded images in above-fold content
4. Check TTFB — Next.js SSR page should be fast

---

### Phase 7 — Generate Audit Report

**Goal**: Produce the final structured output.

Write the report to: `.agent/audit/system_audit_report.json` AND
`.agent/audit/system_audit_report.md`

The report must contain all 5 sections:

#### 7.1 Executive Summary
```json
{
  "audit_version": "v3.1",
  "timestamp": "<ISO8601>",
  "overall_health_score": "<0-100>",
  "critical_violations": [],
  "top_risks": [],
  "top_optimizations": []
}
```

Score calculation guide:
- Start at 100
- Critical issues: -15 each
- High issues: -7 each
- Medium issues: -3 each
- Low issues: -1 each

#### 7.2 Issue Catalog
Each issue must follow this schema:
```json
{
  "issue_id": "SIMIS-XXX",
  "severity": "critical|high|medium|low",
  "category": "architecture|bug|security|performance|deprecation|redundancy|schema",
  "location": "<file_path>:<line_number>",
  "description": "<what is wrong>",
  "impact": "<what breaks or risks>",
  "root_cause": "<why it exists>",
  "recommended_fix": "<concrete code or config change>"
}
```

#### 7.3 System Flow Graph (Text DAG)
```
[CLI simis-ops]
  └─→ POST /api/admin/command (Zod validate → EventQueueLog → BullMQ)
        └─→ commandWorker → handlers → DB update
[Web /admin]
  └─→ POST /api/admin/command (same path)
  └─→ GET /api/admin/metrics (MetricsAggregatorService → Postgres)
  └─→ GET /api/admin/trace/:id (EventQueueLog DAG)
[MVP Layer - SEPARATE SQLITE PATH ⚠️]
  └─→ /api/mvp/* → sqlite_db → (no EventQueueLog, no traceId)
[AI Enrichment Worker]
  └─→ simis-ai-queue → EntityOrchestrator / AttentionOrchestrator / ...
[AI Advisory]
  └─→ prisma.findMany() ONLY — no write path ✅
```

#### 7.4 Actionable Backlog (Priority Order)
Format each item as an executable engineering task:

```
[CRITICAL-001] Fix RBAC: migrate role reads from user_metadata → app_metadata
  File: apps/api/src/core/permission_guard.ts:33-36
  Action: Replace user.user_metadata.role with user.app_metadata.role

[CRITICAL-002] Fix SSE memory leak: add abort signal handler to legacy telemetry stream
  File: apps/api/src/routers/admin.ts:174
  Action: Add c.req.raw.signal.aborted check in while loop condition

[CRITICAL-003] Decide: deprecate legacy admin.ts or migrate endpoints to SIMISCommand
  File: apps/api/src/routers/admin.ts (entire file)
  Action: Either mount legacy on /api/v2/admin and new on /api/admin, or migrate all endpoints

[HIGH-001] Add EventQueueLog.status index for queue depth queries
  File: apps/api/prisma/schema.prisma:EventQueueLog
  Action: Add @@index([status]) to EventQueueLog model

[HIGH-002] Fix LLMCallLog.cost type from Float to Decimal
  File: apps/api/prisma/schema.prisma:LLMCallLog
  Action: cost Decimal @db.Decimal(10,6)

[HIGH-003] Implement ai-cache checkSemanticCache with pgvector
  File: packages/ai-cache/src/cache.ts:44-51
  Action: Replace TODO with actual Prisma pgvector cosine similarity query

[HIGH-004] Add BullMQ job cleanup options to commandWorker and enrichmentWorker
  File: apps/worker/src/ai.worker.ts
  Action: Add removeOnComplete: {count: 1000}, removeOnFail: {count: 500}

[MEDIUM-001] Fix AI Router quota INCRBY race condition
  File: packages/ai-router/src/router.ts:82-88
  Action: Use atomic SET...NX...EX or Lua script

[MEDIUM-002] Add circuit breaker to AI Router fallback chain
  File: packages/ai-router/src/router.ts
  Action: Implement exponential backoff + provider health tracking in Redis

[MEDIUM-003] Create control_audits Prisma model and wire orchestrator
  File: apps/api/prisma/schema.prisma + orchestrator.ts
  Action: Define model, run migration, replace console.log with prisma.create

[LOW-001] Add aria-checked to Dry-Run toggle button in admin UI
  File: apps/web/app/admin/page.tsx
  Action: Add role="switch" aria-checked={isDryRun} to toggle button
```

#### 7.5 Risk Heatmap
```json
{
  "data_integrity": {
    "score": "HIGH_RISK",
    "drivers": ["SQLite/Postgres dual-DB split", "audit log is console.log only", "LLMCallLog uses Float for cost"]
  },
  "system_reliability": {
    "score": "MEDIUM_RISK",
    "drivers": ["SSE memory leak in legacy admin", "no circuit breaker on AI Router", "BullMQ jobs never cleaned up"]
  },
  "scalability": {
    "score": "MEDIUM_RISK",
    "drivers": ["semantic cache is non-functional (100% LLM calls)", "no Redis hot-key sharding strategy", "SQLite not horizontally scalable"]
  },
  "security": {
    "score": "CRITICAL_RISK",
    "drivers": ["user_metadata used for RBAC (user-editable, privilege escalation)", "no scope payload sanitization in SIMISCommand handler"]
  },
  "observability": {
    "score": "MEDIUM_RISK",
    "drivers": ["traceId not propagated in MVP/SQLite path", "SSE telemetry stream is hardcoded mock data", "DLQ endpoint returns stub data"]
  }
}
```

---

## Rate Limiting

This skill performs only static file analysis and read-only Prisma queries.
No external API calls are made during the audit. If Chrome DevTools MCP is
used for the UI audit phases, all interactions are local (no network rate limits).

---

## Common Mistakes

1. **Skipping Phase 1** — without building the module map first, you will miss
   the dual admin router and SQLite/Postgres split, which are the most
   consequential architectural issues.

2. **Treating all pnpm WARNs as errors** — the Prisma Studio React peer
   dependency warnings are non-blocking and should be noted but not scored
   as issues. Only `error TS` errors count.

3. **Marking the legacy `admin.ts` as "deleted"** — it is NOT deleted and may
   still be mounted (check `index.ts` at time of audit). Always verify against
   the live codebase rather than assuming the implementation matches the latest
   session memory.

4. **Ignoring the SQLite layer** — the MVP router (`/api/mvp/*`) uses a separate
   SQLite database that is completely invisible to the Postgres EventQueueLog.
   This is the most impactful data integrity gap in the system and must be
   prominently flagged in the executive summary.

5. **Not using `safeParse` results** — when verifying Zod validation, confirm
   the code checks `validationResult.success` and returns 400 on failure.
   Calling `.parse()` without try/catch is also a valid pattern but throws
   uncaught exceptions on invalid input.
