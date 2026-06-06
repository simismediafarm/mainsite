import { TrafficSignal } from "./telemetry";

export type BackendVersion = "v1" | "v2" | "blended";

export interface RouteContext {
  userId?: string;
  userSegment?: "new" | "returning" | "power";
  featureFlags?: Record<string, boolean>;
  signal?: TrafficSignal;
}

export const defaultFlags = {
  feed_v2: false,
  content_v2: false,
};

// EMA Smoothing factor: S_t = alpha * S_current + (1 - alpha) * S_previous
const ALPHA = 0.3;

export function scoreSignal(signal: TrafficSignal, version: "v1" | "v2", previousScore?: number): number {
  if (!signal) return version === "v1" ? 1 : 0;

  // Simple weighted score for current state
  const wLatency = 0.4;
  const wError = 0.6;

  let currentScore = 0;
  if (version === "v2") {
    const normalizedLatency = Math.max(0, 1 - (signal.latencyV2 / 1000));
    const normalizedError = Math.max(0, 1 - signal.errorRateV2);
    currentScore = (normalizedLatency * wLatency) + (normalizedError * wError);
  } else {
    const normalizedLatency = Math.max(0, 1 - (signal.latencyV1 / 1000));
    const normalizedError = Math.max(0, 1 - signal.errorRateV1);
    currentScore = (normalizedLatency * wLatency) + (normalizedError * wError);
  }

  // Apply EMA smoothing if we have historical score
  if (previousScore !== undefined) {
    return ALPHA * currentScore + (1 - ALPHA) * previousScore;
  }
  
  return currentScore;
}

export function resolveVersion(route: string, ctx: RouteContext): BackendVersion {
  if (process.env.FORCE_V2 === "true") return "v2";

  const flags = { ...defaultFlags, ...ctx.featureFlags };

  // Manual overrides first
  if (route.startsWith("/feed") && !flags.feed_v2) return "v1";

  if (ctx.signal) {
    const scoreV1 = scoreSignal(ctx.signal, "v1");
    const scoreV2 = scoreSignal(ctx.signal, "v2");
    
    const diff = scoreV2 - scoreV1;
    if (diff > 0.25) return "v2";
    if (diff < -0.25) return "v1";
    return "blended";
  }

  // Default fallback if no signal
  return "v1";
}
