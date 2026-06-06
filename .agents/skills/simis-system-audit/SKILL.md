---
name: simis-system-audit
description: >-
  Holistic, architecture-agnostic system audit skill based on execution behavior, 
  control/data/event/ai/observability planes, and integrity invariants. Detects architecture 
  violations, data integrity anomalies, event trace gaps, and AI safety risks dynamically.
---

# Adaptive System Audit & Deep Intelligence Analysis (v2.0-adaptive-control-plane)

This skill guides the agent to perform a holistic, architecture-agnostic system audit. Instead of scanning specific file paths or assuming a particular repository layout, it infers the architecture dynamically from system behavior, execution flows, and key structural patterns across five distinct planes.

## Core Principles

- **No Path Dependency**: Avoid assuming hardcoded paths (e.g., `apps/api` or `packages/shared`). Dynamically discover entry points, modules, configurations, and structures.
- **No Repository Structure Assumptions**: Be layout-resilient. Work with monorepos, polyrepos, flat structures, or containerized setups.
- **Behavior Over Code Priority**: Prioritize actual execution behavior, runtime configuration, and side-effects over static definitions.
- **Execution Flow as Source of Truth**: Map system interactions along the flow: `input → control → event → compute → side_effect → persistence → observability`.
- **Multi-Layer System Model**: Build a mental and documented model of the system across the five primary planes.

---

## The 5-Plane System Model

When auditing any system, analyze it through these five dimensions:

1. **Control Plane**: Entry points, API routing, command validation, authorization boundaries, mutation gateways.
2. **Data Plane**: Relational databases, cache layers, in-memory stores, persistent files, dual-writes, data replication flows.
3. **Event Plane**: Queues, message brokers, pub-sub systems, event-sourcing ledgers, trace propagation.
4. **AI Plane**: LLM integration layers, prompt engineering boundaries, semantic caches, context generation, circuit breakers, cost control logic.
5. **Observability Plane**: Trace IDs, structured logs, metrics aggregation, health check loops, telemetry feeds, client cleanup (SSE/WebSocket).

---

## 7-Phase Analysis Methodology

### Phase 1: System Discovery (Inference-Based)
- **Goal**: Identify entry points, outputs, and side effects dynamically.
- **Actions**:
  - Locate main servers, worker processes, cron/scheduler configurations, CLI entry points, and message/event consumers.
  - Map all potential sources of state mutations.
  - Map all persistence sinks (databases, storage buckets, external APIs).
  - Construct an abstract execution graph showing how inputs propagate to persistence and side-effects.

### Phase 2: Control Plane Audit
- **Goal**: Evaluate mutation authority and authorization correctness.
- **Actions**:
  - Verify if all mutations pass through validated control plane pathways.
  - Detect direct data writes bypassing the control plane (e.g., direct DB updates from endpoints, client-side mutations).
  - Audit RBAC/ABAC enforcement: Ensure authority is server-enforced and claims are immutable (e.g., check for user-controlled metadata/claims being used for authorization).
  - Scan for bypass endpoints, debug backdoors, or undocumented/hidden mutation paths.

### Phase 3: Data Integrity Audit
- **Goal**: Assess truth consistency and correctness of the persistence model.
- **Actions**:
  - Identify split-brain scenarios (e.g., multiple databases or storage systems holding the same domain entity without sync).
  - Detect in-memory or local file-based shadow stores (e.g., SQLite used for quick writes alongside Postgres without reconciliation).
  - Check event sourcing coverage: If event logging is used, verify that all mutations actually write to the event log.
  - Validate persistence determinism (ensure race conditions do not produce inconsistent states).

### Phase 4: Event Trace Audit
- **Goal**: Validate end-to-end observability completeness and event routing.
- **Actions**:
  - Ensure that every mutation emits a corresponding event or audit trail.
  - Verify that a unified `trace_id` is generated at the system boundary and propagated through all queues, workers, and side-effects.
  - Reconstruct the execution DAG (Directed Acyclic Graph) for critical operations.
  - Detect orphaned events, message drops, or missing lineage details.

### Phase 5: AI Plane Isolation Audit
- **Goal**: Evaluate AI safety, control boundaries, and resource utilization.
- **Actions**:
  - Check that AI models/agents do not directly mutate persistence layers; they must route actions through the Control Plane.
  - Inspect AI fallback chains: Ensure they have circuit breaker logic to handle provider outages or timeouts without cascading latency.
  - Validate semantic cache effectiveness, token consumption safeguards, and cost control boundaries.

### Phase 6: Security & Authorization Integrity Audit
- **Goal**: Detect privilege escalation and authorization bypass vectors.
- **Actions**:
  - Verify that no user-controlled metadata (e.g., JWT user_metadata claims that are user-editable) is used for security policy evaluation.
  - Confirm that only server-side, cryptographically signed, or immutable claims are used for RBAC/ABAC.
  - Detect privilege escalation paths and validate scope enforcement consistency across all APIs.

### Phase 7: Observability Plane Audit
- **Goal**: Ensure the system has complete introspection capabilities.
- **Actions**:
  - Verify that long-lived connections (e.g., SSE, WebSockets) handle client disconnect cleanups and do not leak resources.
  - Ensure all logs are structured and include the relevant `trace_id`.
  - Validate that telemetry metrics represent actual system states (no stub/mock telemetry in production).
  - Identify non-observability layers (e.g., using `console.log` as the primary production telemetry mechanism).

---

## Pattern Detection Engine

Look for the following semantic patterns using behavioral inference rather than strict static string matching:

| Pattern ID | Pattern Name | Description |
|---|---|---|
| **`multi_db_split`** | Split-Brain DB | Dual database writes (e.g., SQLite + Postgres) without transaction coordination. |
| **`shadow_state_memory`** | Shadow State | Important state held only in process memory (e.g., global variables) resetting on restart. |
| **`event_bypass_mutation`** | Event Bypass | Directly updating the database without triggering queue jobs or emitting events. |
| **`unauthorized_metadata_auth`** | Metadata Auth Leak | Relying on client-updatable profile/user metadata to authorize actions. |
| **`missing_trace_propagation`** | Lost Trace | Queued tasks or external service calls losing their correlation `trace_id`. |
| **`infinite_loop_no_abort`** | Unbounded Loop | Loops (especially in SSE/WebSockets) running indefinitely without an abort signal listener. |
| **`mock_or_stub_production_logic`** | Stubbed Logic | Critical components (like semantic caching or DLQ retries) implemented as `return null` / no-op placeholders. |
| **`unbounded_queue_growth`** | Redis Job Bloat | Queue configurations (like BullMQ) lacking stale job cleanups (`removeOnComplete`/`removeOnFail`). |
| **`non_atomic_cache_updates`** | Race-Condition Cache | Non-atomic read-modify-write patterns leading to cache stampedes or lost updates. |

---

## Risk Model & Propagation Logic

Trace how individual defects propagate throughout the system:
`Defect / Issue → Subsystem Impact → Dependent Subsystems Impact → Systemic Failure`

Map all findings against these dimensions:
1. **Data Integrity** (e.g., dual-DB writes, missing audit tables, loose transaction boundaries).
2. **System Reliability** (e.g., unhandled loops, lack of circuit breakers, unbounded queue growth).
3. **Security Boundary Violation** (e.g., metadata-based RBAC, unvalidated scopes, direct mutations).
4. **Observability Loss** (e.g., untraced flows, stub telemetry, console.log-only auditing).
5. **AI Control Drift** (e.g., AI bypasses control plane, unhandled AI fallback failures).
6. **Scalability Breakdown** (e.g., database pool exhaustion, lack of caching, inefficient queries).

---

## Output Schema Guidelines

The generated audit report must conform to this structure:

### 1. Executive Summary
- **System Architecture (Inferred)**: Description of the inferred system topology.
- **Scores (0–100)**:
  - Overall Health Score (Start at 100, deduct: Critical: -15, High: -7, Medium: -3, Low: -1).
  - Integrity Score.
  - Security Score.
  - Observability Score.
- **Critical Failure Modes**: Summary of top risk scenarios.

### 2. Execution Graph
- Represent the data/event flows as a directed acyclic text graph or Mermaid diagram showing how input reaches persistence.

### 3. Issue Graph / Catalog
For each issue, specify:
- `issue_id` (Unique identifier, e.g., AUDIT-001)
- `node/component`: Affected behavioral unit or system module
- `category`: `architecture | security | data | ai | observability | reliability`
- `severity`: `critical | high | medium | low`
- `description`: What is the behavioral issue?
- `root_cause`: Systemic/logical reason (not just file-level lines)
- `impact`: Cross-system effects and propagation chain
- `fix_strategy`:
  - `immediate`: Minimal safe mitigation
  - `long_term`: Structural/architectural correction

### 4. Risk Heatmap
- Detail the risk level (Critical, High, Medium, Low) and specific drivers for:
  - Data Integrity
  - Security
  - Reliability
  - Observability
  - Scalability

### 5. Prioritized Actionable Backlog
- Organize tasks using priority tags (`P0 | P1 | P2`).
- Each task must define the engineering work, the target component, and expected system improvement.

---

## Constraints

- **Read-Only**: Do not perform code writes, schema migrations, or state mutations.
- **Evidence-Based**: Do not assume; prove invariants via static query or local behavioral invocation.
- **Inference First**: If directory or file names differ from expectations, inspect configurations (e.g., `package.json`, `pnpm-workspace.yaml`, `.env`) to reconstruct the system layout.
