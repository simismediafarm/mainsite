import { resolveVersion, RouteContext } from "./router";
import { v1Client } from "./clients/v1.client";
import { v2Client } from "./clients/v2.client";
import { telemetry } from "./telemetry";
import { assertFeedV2, ValidationMode } from "@simis/contracts";

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
    const version = resolveVersion("/feed", ctx);
    
    // Execute route and wrap with telemetry tracking
    return telemetry.trackRoute("/feed", version, async () => {
      let decision = version;
      if (decision === "blended") {
        decision = Math.random() < 0.7 ? "v2" : "v1";
      }

      if (decision === "v2") {
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
          return await v1Client.feed();
        }
      }

      return await v1Client.feed();
    });
  },

  async content(slug: string, ctx: RouteContext = {}) {
    const version = resolveVersion("/content", ctx);
    
    return telemetry.trackRoute("/content", version, async () => {
      let decision = version;
      if (decision === "blended") {
        decision = Math.random() < 0.7 ? "v2" : "v1";
      }

      if (decision === "v2") {
        try {
          const data = await v2Client.content(slug);
          // Assuming content schema guard exists: assertContentV2(data, VALIDATION_MODE);
          return data;
        } catch (err) {
          telemetry.emit("fallback_triggered", {
            from: "v2",
            to: "v1",
            reason: err instanceof Error ? err.message : String(err)
          });
          return await v1Client.content(slug);
        }
      }

      return await v1Client.content(slug);
    });
  },
};
