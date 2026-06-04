// trace_check.js – read‑only OpenTelemetry span integrity scanner
// Run daily (e.g., via cron) to ensure the mandatory span chain exists.

const { execSync } = require('child_process');
const fs = require('fs');

// Assume OTEL collector exports spans to a JSON file for read‑only access.
// Path can be configured via env var OTEL_SPANS_FILE.
const spansFile = process.env.OTEL_SPANS_FILE || '/tmp/otel_spans.json';

function loadSpans() {
  if (!fs.existsSync(spansFile)) {
    console.error(`[TRACE SCAN] spans file not found: ${spansFile}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(spansFile, 'utf8');
  return JSON.parse(raw);
}

function checkChain(spans) {
  const required = [
    'intent_created',
    'ingestion_completed',
    'signal_generated',
    'decision_emitted',
    'poe_finalized',
  ];

  const present = required.filter((name) => spans.some((s) => s.name === name));
  if (present.length !== required.length) {
    console.error(`[TRACE SCAN] missing spans: ${required.filter((n) => !present.includes(n)).join(', ')}`);
    process.exit(1);
  }
  console.log('[TRACE SCAN] COMPLETE – all required spans present');
}

function main() {
  try {
    const spans = loadSpans();
    checkChain(spans);
  } catch (e) {
    console.error(`[TRACE SCAN] error: ${e.message}`);
    process.exit(1);
  }
}

main();
