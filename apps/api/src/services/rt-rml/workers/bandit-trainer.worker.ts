import { BanditEngine } from "../bandit/bandit-engine";
import { RedisStream } from "../queue/redis-stream";

export class BanditTrainer {
  static async start() {
    console.log("[RT-RML] Bandit Trainer started");

    while (true) {
      const batch = await RedisStream.consume("rtmm-group", "trainer");

      if (!batch) continue;

      // optional batch optimization step
      await new Promise((r) => setTimeout(r, 100));
    }
  }
}
