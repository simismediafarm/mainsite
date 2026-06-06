import { TrafficSignal } from "./telemetry";

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
