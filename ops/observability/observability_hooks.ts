import { trace, metrics } from "@opentelemetry/api";
import { posthog } from "./posthog_client.js";

const tracer = trace.getTracer("simis-e2e-dashboard");

/**
 * Hook into execution pipeline for live dashboard streaming
 * Strictly side-effect instrumentation (IAC v1.0 Compliant)
 */
export function attachObservabilityHooks(pipeline: any) {

  pipeline.on("intent_created", (data: any) => {
    const span = tracer.startSpan("intent_created");
    span.setAttribute("intent_id", data.intent_id);
    span.setAttribute("mode", data.mode || "LIVE");

    posthog.capture({
      distinctId: 'system',
      event: 'ingestion_started',
      properties: {
        intent_id: data.intent_id,
        url: data.url,
        mode: data.mode || "LIVE"
      }
    });
    span.end();
  });

  pipeline.on("ingestion_completed", (data: any) => {
    const span = tracer.startSpan("ingestion_completed");
    
    posthog.capture({
      distinctId: 'system',
      event: 'ingestion_completed',
      properties: {
        intent_id: data.intent_id,
        latency_ms: data.latency_ms,
        status: data.status // SUCCESS | FAILED
      }
    });
    span.end();
  });

  pipeline.on("signal_generated", (data: any) => {
    const span = tracer.startSpan("signal_generated");

    const meter = metrics.getMeter("simis");
    meter.createHistogram("signal_score").record(data.score);

    posthog.capture({
      distinctId: 'system',
      event: 'signal_generated',
      properties: {
        signal_id: data.signal_id,
        score: data.score,
        entity_count: data.signals ? data.signals.length : 0
      }
    });

    span.end();
  });

  pipeline.on("decision_emitted", (data: any) => {
    const span = tracer.startSpan("decision_emitted");

    posthog.capture({
      distinctId: 'system',
      event: 'decision_emitted',
      properties: {
        intent_id: data.intent_id,
        decision: data.type,
        confidence_score: data.confidence_score
      }
    });

    span.end();
  });

  pipeline.on("poe_finalized", (data: any) => {
    const span = tracer.startSpan("poe_finalized");

    posthog.capture({
      distinctId: 'system',
      event: 'poe_finalized',
      properties: {
        poe_hash: data.hash,
        valid: data.valid,
        replay_consistent: data.replay_consistent
      }
    });

    span.end();
  });

}
