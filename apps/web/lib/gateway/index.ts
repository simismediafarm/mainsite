import { RouteContext } from "./router";
import { v1Client } from "./clients/v1.client";
import { v2Client } from "./clients/v2.client";
import { telemetry } from "./telemetry";
import { assertFeedV2, ValidationMode } from "@simis/contracts";
import { store } from "../same/state";

const ENV = process.env.NODE_ENV || "development";

const CONTRACT_MODE_MAP: Record<string, ValidationMode> = {
  development: "strict",
  test: "strict",
  staging: "strict",
  production: "observed",
  emergency: "off",
};

const VALIDATION_MODE = (process.env.GATEWAY_VALIDATION as ValidationMode) ?? CONTRACT_MODE_MAP[ENV] ?? "observed";

export const gateway = {
  async feed(ctx: RouteContext = {}) {
    const state = await store.get("/feed");
    
    return telemetry.trackRoute("/feed", state.phase as any, async () => {
      switch (state.phase) {
        case "PHASE_0":
          // STABLE_CORE: Pure V1
          return await v1Client.feed();

        case "PHASE_1": {
          // SHADOW_MODE: Async mirror
          const result = await v1Client.feed();
          // Fire and forget V2
          Promise.resolve().then(async () => {
            try {
              const data = await v2Client.feed();
              assertFeedV2(data, "off"); // Shadow shouldn't throw to users anyway, but we log
              telemetry.emit("shadow_success", { route: "/feed" });
            } catch (err) {
              telemetry.emit("shadow_error", { route: "/feed", error: String(err) });
            }
          });
          return result;
        }

        case "PHASE_2": {
          // OBSERVED_MODE: Compare execution
          const [v1Result, v2Result] = await Promise.allSettled([
            v1Client.feed(),
            v2Client.feed()
          ]);
          
          if (v2Result.status === "rejected") {
            telemetry.emit("observed_error", { route: "/feed", error: String(v2Result.reason) });
          } else {
            // Optional: deep compare v1Result.value and v2Result.value here
            telemetry.emit("observed_success", { route: "/feed" });
            assertFeedV2(v2Result.value, VALIDATION_MODE);
          }

          if (v1Result.status === "fulfilled") {
            return v1Result.value;
          }
          throw v1Result.reason;
        }

        case "PHASE_3":
        case "PHASE_4": {
          // CONTROLLED_DUAL_RUN / GRADUAL_MIGRATION
          // Probabilistic split based on v2TrafficRatio
          if (Math.random() < state.v2TrafficRatio) {
            try {
              const data = await v2Client.feed();
              assertFeedV2(data, VALIDATION_MODE);
              return data;
            } catch (err) {
              telemetry.emit("fallback_triggered", {
                from: "v2",
                to: "v1",
                reason: err instanceof Error ? err.message : String(err)
              });
              // Instant fallback
              return await v1Client.feed();
            }
          }
          return await v1Client.feed();
        }

        case "PHASE_5": {
          // V2_PRIMARY: Default to V2, fallback only on critical emergency
          try {
            const data = await v2Client.feed();
            assertFeedV2(data, VALIDATION_MODE);
            return data;
          } catch (err) {
            if (process.env.GATEWAY_VALIDATION === "off") {
              return await v1Client.feed();
            }
            throw err;
          }
        }

        default:
          return await v1Client.feed();
      }
    });
  },

  async content(slug: string, ctx: RouteContext = {}) {
    // Similarly simplified for content
    const state = await store.get("/content");
    
    return telemetry.trackRoute("/content", state.phase as any, async () => {
      // Fast path for content fallback logic
      if (state.phase === "PHASE_0" || state.phase === "PHASE_1") {
        return await v1Client.content(slug);
      }
      return await v1Client.content(slug); // Placeholder until content contracts are added
    });
  },
};
