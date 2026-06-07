import { createRedisClient } from "@simis/config";

export const redis = createRedisClient();

redis.on("error", (err) => {
  console.warn("[Redis Stream] Connection warning (safe to ignore in non-Redis environments):", err.message);
});

const STREAM_KEY = "rtmm:telemetry:stream";

export class RedisStream {
  static async publish(event: any) {
    await redis.xadd(
      STREAM_KEY,
      "*",
      "payload",
      JSON.stringify(event)
    );
  }

  static async consume(group: string, consumer: string) {
    try {
      // Create group if it doesn't exist
      await redis.xgroup("CREATE", STREAM_KEY, group, "$", "MKSTREAM");
    } catch (e: any) {
      if (!e.message.includes("BUSYGROUP")) {
        console.error("Error creating consumer group", e);
      }
    }

    return redis.xreadgroup(
      "GROUP",
      group,
      consumer,
      "COUNT",
      10,
      "BLOCK",
      5000,
      "STREAMS",
      STREAM_KEY,
      ">"
    );
  }
}
