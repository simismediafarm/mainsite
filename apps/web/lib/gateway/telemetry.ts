export type TrafficSignal = {
  latencyV1: number;
  latencyV2: number;
  errorRateV1: number;
  errorRateV2: number;
  endpoint: string;
  userSegment: "new" | "returning" | "power";
};

class GatewayTelemetry {
  emit(event: string, payload: any) {
    if (process.env.NODE_ENV !== "test") {
      console.log(`[ATIL TELEMETRY] ${event}`, JSON.stringify(payload));
    }
  }

  async trackRoute(
    endpoint: string, 
    version: "v1" | "v2" | "blended", 
    action: () => Promise<any>
  ) {
    const start = Date.now();
    let success = true;
    try {
      const result = await action();
      return result;
    } catch (err) {
      success = false;
      throw err;
    } finally {
      const latency = Date.now() - start;
      this.emit("route_executed", {
        endpoint,
        version,
        success,
        latency,
      });
    }
  }
}

export const telemetry = new GatewayTelemetry();
