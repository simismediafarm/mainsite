# Observability Activation – Status & Next Steps

## ✅ Current Running Services (Read‑Only)

| Service | Command / PID | Log File | Expected Output |
|---|---|---|---|
| **Health‑Sync Daemon** | `nohup ./ops/scripts/health_sync.sh &` (PID stored in `$!`) | `/tmp/health_sync.log` | Lines like `[HEALTH_SYNC] <timestamp> – METRIC_DRIFT <1% … – OK` |
| **PoE Validator** | `nohup ./ops/scripts/poe_validator.sh &` (PID stored in `$!`) | `/tmp/poe_validator.log` | Lines like `[POE VALIDATOR] <timestamp> – HASH MATCH (intent …)` |
| **Trace‑Integrity Scanner** (cron) | `crontab -l` shows `0 0 * * * node ./ops/scripts/trace_check.js` | `/tmp/trace_check.log` (appended each midnight) | `[TRACE SCAN] COMPLETE – all required spans present` |

> **Verification:** Open each log file and confirm the “OK”/“MATCH” messages appear. No errors/writes to kernel should be present.

---

## 📅 Immediate Next Steps

1. **Replace placeholder credentials** in the three scripts (`YOUR_PROJECT_ID`, `YOUR_READ_ONLY_API_KEY`, Grafana endpoint).  
2. **Restart each daemon** to pick up the real credentials:
   ```bash
   pkill -f health_sync.sh && nohup ./ops/scripts/health_sync.sh > /tmp/health_sync.log 2>&1 &
   pkill -f poe_validator.sh && nohup ./ops/scripts/poe_validator.sh > /tmp/poe_validator.log 2>&1 &
   ```
3. **Confirm cron entry** is active:
   ```bash
   crontab -l | grep trace_check.js
   ```
   If missing, re‑add:
   ```bash
   (crontab -l 2>/dev/null; echo "0 0 * * * node $(pwd)/ops/scripts/trace_check.js >> /tmp/trace_check.log 2>&1") | crontab -
   ```
4. **Collect a one‑hour snapshot** of logs to produce an audit artifact:
   ```bash
   tail -n 100 /tmp/health_sync.log > ./ops/artifacts/health_sync_snapshot.log
   tail -n 100 /tmp/poe_validator.log > ./ops/artifacts/poe_validator_snapshot.log
   tail -n 100 /tmp/trace_check.log > ./ops/artifacts/trace_check_snapshot.log
   ```
5. **Generate a short compliance report** (markdown artifact) summarising the observed status.  
   The script `ops/scripts/generate_report.sh` (created below) will concatenate the three snapshots into `observability_status_report.md`.

---

## 📜 Automation Helper – `generate_report.sh`

```bash
#!/usr/bin/env bash
# generate_report.sh – compose a concise status report from the three snapshots
REPORT=./ops/artifacts/observability_status_report.md
{
  echo "# Observability Status Report"
  echo "Generated: $(date)"
  echo "\n## Health‑Sync Snapshot"
  cat ./ops/artifacts/health_sync_snapshot.log
  echo "\n## PoE Validator Snapshot"
  cat ./ops/artifacts/poe_validator_snapshot.log
  echo "\n## Trace‑Check Snapshot"
  cat ./ops/artifacts/trace_check_snapshot.log
} > $REPORT

echo "Report written to $REPORT"
```

Make it executable:
```bash
chmod +x ./ops/scripts/generate_report.sh
```
Run it after the snapshot step to obtain `observability_status_report.md`.

---

## 🚀 Final Goal

When the report is generated, the **Observability Activation Layer** will be fully operational and auditable, fulfilling Phase 1 (Health‑Sync) and Phase 2 (Trace‑Integrity) of the post‑audit roadmap without touching any kernel code.

*All actions remain read‑only and respect the `ABSOLUTE_FROZEN` contract.*
