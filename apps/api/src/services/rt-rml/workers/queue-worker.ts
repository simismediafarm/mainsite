import { RedisStream } from "../queue/redis-stream";
import { FraudFilter } from "../fraud/fraud-filter";
import { BanditEngine } from "../bandit/bandit-engine";

export class QueueWorker {
  private static isShuttingDown = false;

  static async start() {
    console.log("[RT-RML] Queue Worker started");
    
    // Register graceful shutdown listeners
    process.on('SIGTERM', () => {
      this.isShuttingDown = true;
    });
    process.on('SIGINT', () => {
      this.isShuttingDown = true;
    });

    while (!this.isShuttingDown) {
      try {
        const data = await RedisStream.consume("rtmm-group", "worker-1");

        if (!data) {
          // Idle delay to prevent 100% CPU tight-loop
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }

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
      } catch (err) {
        console.error("[RT-RML] Queue Worker loop error:", err);
        // Error backoff delay
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    console.log("[RT-RML] Queue Worker stopped gracefully");
  }
}
