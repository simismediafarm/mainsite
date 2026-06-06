import { BanditEngine } from "../bandit/bandit-engine";
import { RedisStream } from "../queue/redis-stream";

export class BanditTrainer {
  private static isShuttingDown = false;

  static async start() {
    console.log("[RT-RML] Bandit Trainer started");

    // Register graceful shutdown listeners
    process.on('SIGTERM', () => {
      this.isShuttingDown = true;
    });
    process.on('SIGINT', () => {
      this.isShuttingDown = true;
    });

    while (!this.isShuttingDown) {
      try {
        const batch = await RedisStream.consume("rtmm-group", "trainer");

        if (!batch) {
          // Idle delay to prevent 100% CPU tight-loop
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }

        // optional batch optimization step
        await new Promise((r) => setTimeout(r, 100));
      } catch (err) {
        console.error("[RT-RML] Bandit Trainer loop error:", err);
        // Error backoff delay
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    console.log("[RT-RML] Bandit Trainer stopped gracefully");
  }
}
