# ADR 015: DECT Kernel Architecture

## Status
Approved

## Context
The SIMIS platform requires strict guarantees of determinism, provenance, and idempotency across distributed state transitions. Previous implementations relied on implicit conventions and a porous architecture where the `executeTransaction` path could be bypassed, breaking replayability and creating drift between the mathematical specification and runtime behavior.

## Decision
We implemented a **Dual-Layer Execution Architecture (v7.3)** where:
1. **Runtime Plane:** A deterministic transition system (TypeScript ECVM, Total-Order Scheduler, Graph Decay Guard, Replay Engine).
2. **Formal Plane:** A Lean 4 predicate system defining invariants for IO, scheduling, and purity.
3. **Closure Bridge:** The cryptographic sealing layer that canonicalizes Lean proofs into hashes and stores them via Proof of Execution (PoE) in the `kernel_execution_certificates` ledger.

Key technological choices:
- Single execution path via `runExecutionPipeline`.
- Supabase for PostgreSQL durability and realtime SSE (Hono API layer).
- Hono TS API (instead of FastAPI) to ensure schema/typing invariance across boundaries.
- Next.js Web Dashboard and Ink TUI CLI for operational control, secured by Supabase Auth and RLS.

## Consequences
- **Positive:** True mathematical execution provenance. Drift becomes structurally impossible to commit.
- **Negative:** Increased complexity in the runtime sandbox. Operations must carefully manage side-effects.

## Verification
- CI workflow runs unit tests and executes dry-run symbolic simulations.
- `replayIntent` enforces structural parity on-demand.
