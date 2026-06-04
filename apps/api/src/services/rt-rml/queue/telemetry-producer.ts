import { RedisStream } from "./redis-stream";
import { TelemetryEvent } from "../types";

export class TelemetryProducer {
  static async emit(event: TelemetryEvent) {
    await RedisStream.publish({
      ...event,
      timestamp: Date.now()
    });
  }
}
