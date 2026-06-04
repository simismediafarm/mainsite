import { RedisStream } from "../queue/redis-stream";
import { FraudFilter } from "../fraud/fraud-filter";
import { BanditEngine } from "../bandit/bandit-engine";

export class QueueWorker {
  static async start() {
    console.log("[RT-RML] Queue Worker started");
    while (true) {
      const data = await RedisStream.consume("rtmm-group", "worker-1");

      if (!data) continue;

      for (const [, messages] of (data as any[])) {
        for (const [, payload] of messages) {
          try {
            const eventStr = payload[1];
            if (!eventStr) continue;
            
            const event = JSON.parse(eventStr);

            const result = FraudFilter.evaluate(event.reward);

            if (!result.valid) continue;

            BanditEngine.update(
              event.context,
              event.action,
              result.reward
            );
          } catch (e) {
            console.error("Failed to process event", e);
          }
        }
      }
    }
  }
}
