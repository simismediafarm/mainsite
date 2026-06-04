# Post‑Audit Implementation Plan for SIMIS (ABSOLUTE_FROZEN)

## Goal
Create a concrete, low‑risk roadmap to **verify**, **document**, **certify**, and **maintain** the deterministic execution platform now that it is frozen under IAC v1.0.

---

## 1️⃣ Phase 1 – Continuous Observability & Health‑Check
| Activity | Description | Owner | Frequency | Success Criteria |
|---|---|---|---|---|
| **Dashboard Health‑Sync** | Validate Grafana panels against real‑time PostHog metrics (through API poll). | Ops‑Team | Every hour | No divergence > 1 % between recorded IOBuffer rate and dashboard series. |
| **Span Integrity Scan** | Run a nightly script that walks the OpenTelemetry trace graph and asserts the mandatory chain `intent_created → ingestion_completed → signal_generated → decision_emitted → poe_finalized`. | Observability Engineer | Daily | 100 % of spans present, ordered, and linked. |
| **PoE Seal Validator** | Compute a fresh PoE seal from the latest IOBuffer snapshot and compare to stored PoE hashes. | Security Auditor | Every run (triggered by new intent). | Hash match; any mismatch raises an immediate alert. |

---

## 2️⃣ Phase 2 – Formal Determinism Re‑Verification
| Step | Command (read‑only) | Expected Output | Rationale |
|---|---|---|---|
| **2.1** | `simis verify-poe --mode=shadow --dry-run` | Determinism score `1.000`, zero divergences. | Confirms replay firewall remains intact. |
| **2.2** | `simis proof‑audit --export=pdf` | PDF containing theorem proofs, closure bridges, and PoE integrity proof. | Provides a formal artifact for auditors. |
| **2.3** | `simis replay‑stress --iterations=1000` | All 1000 replays produce identical PoE hash. | Stress‑tests the replay engine without mutating state. |

---

## 3️⃣ Phase 3 – Independent Security & Compliance Review
1. **External Pen‑Test (Read‑Only)** – Contract a third‑party to attempt read‑only data exfiltration via PostHog API, OpenTelemetry collector endpoints, and Grafana public dashboards.
2. **Compliance Mapping** – Map the system to ISO 27001 A.12.4 (Logging) and NIST 800‑53 AU‑12 (Audit). Produce a compliance matrix.
3. **Certificate Issuance** – Use the formal proof PDF (Phase 2) to request a **Proof‑Carrying Execution Certificate** from the internal certification authority.

---

## 4️⃣ Phase 4 – Documentation & Knowledge‑Base Update
- **System Certificate** – Publish `SIMIS‑PCDES‑CERT‑v1.0.pdf` in the repository `docs/`.
- **Operational Runbook** – Update `docs/observability_guide.md` with the health‑check scripts and alert thresholds.
- **FAQ & Incident Playbooks** – Add a section describing “What to do if PoE hash mismatch is detected?” (i.e., halt all workers, freeze IOBuffer, launch forensic replay).

---

## 5️⃣ Phase 5 – Controlled Decommission / Archival (Optional)
If the organization decides to retire the platform:
1. **Snapshot IOBuffer** – Export the full ledger to immutable storage (`s3://simis‑archive/iobuffer‑snapshot‑<date>.json`).
2. **Seal the Archive** – Compute a final SHA‑256 hash of the snapshot and store it in the certificate.
3. **Archive Observability Data** – Export PostHog event stream and OpenTelemetry traces to a read‑only data lake.
4. **Record a Final Audit Log** – Append a “System Retirement” entry to the PoE chain (signed with the same private key).

---

## Open Questions (Require User Clarification)
> [!IMPORTANT]
> - **Retention Policy:** How long should the observability data be retained (e.g., 1 year, 5 years)?
> - **External Auditors:** Do you have a preferred third‑party security firm for the read‑only pen‑test?
> - **Archival Destination:** Preferred cloud storage provider for the immutable ledger snapshot?

---

## Verification Plan
| Verification Activity | Tool / Script | Expected Result |
|---|---|---|
| Dashboard ↔ PostHog sync check | `ops/scripts/health_sync.sh` (read‑only) | No metric drift > 1 % |
| Span chain integrity | `ops/scripts/trace_check.js` | All mandatory spans present |
| PoE seal integrity | `ops/scripts/poe_check.ts` | Hash match with ledger |
| Replay determinism stress | `simis replay‑stress --iterations=1000` | 100 % identical hashes |

---

**Prepared by:** AI IDE Agent (Antigravity)
**Date:** 2026‑06‑04
