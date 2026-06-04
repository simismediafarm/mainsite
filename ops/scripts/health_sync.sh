#!/usr/bin/env bash
# health_sync.sh – read‑only verification of IOBuffer throughput vs PostHog / Grafana metrics
# This script runs in a loop, polling every 60 seconds.

POSTHOG_API="https://app.posthog.com/api/projects/YOUR_PROJECT_ID/events/"
POSTHOG_API_KEY="YOUR_READ_ONLY_API_KEY"
GRAFANA_PROM_ENDPOINT="http://localhost:3000/api/datasources/proxy/1/api/v1/query?query=io_buffer_rate"

while true; do
  # Fetch latest IOBuffer rate from PostHog (read‑only)
  POSTHOG_RATE=$(curl -s -G "$POSTHOG_API" \
    -d "event=io_buffer_intent" \
    -d "limit=1" \
    -H "Authorization: Bearer $POSTHOG_API_KEY" |
    jq -r '.[0].properties.rate // empty')

  # Fetch Grafana metric (Prometheus proxy assumed)
  GRAFANA_RATE=$(curl -s "$GRAFANA_PROM_ENDPOINT" |
    jq -r '.data.result[0].value[1] // empty')

  # If either metric is missing, log and continue
  if [[ -z "$POSTHOG_RATE" || -z "$GRAFANA_RATE" ]]; then
    echo "[HEALTH_SYNC] $(date) – metric missing (PostHog:$POSTHOG_RATE Grafana:$GRAFANA_RATE)"
    sleep 60
    continue
  fi

  # Compute absolute percentage drift
  DRIFT=$(awk "BEGIN {print ( ($POSTHOG_RATE - $GRAFANA_RATE) / $GRAFANA_RATE ) * 100 }" )
  DRIFT_ABS=$(awk "BEGIN {print ( $DRIFT < 0 ? -$DRIFT : $DRIFT ) }")

  if (( $(echo "$DRIFT_ABS < 1" | bc -l) )); then
    echo "[HEALTH_SYNC] $(date) – METRIC_DRIFT <1% (PostHog:$POSTHOG_RATE Grafana:$GRAFANA_RATE) – OK"
  else
    echo "[HEALTH_SYNC] $(date) – ALERT: METRIC_DRIFT $DRIFT_ABS% exceeds 1%"
  fi

  sleep 60
done
