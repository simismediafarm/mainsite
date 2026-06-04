import { readDeferredJobs } from "./checkpoint_reader.js";
import { replayFromCheckpoint } from "./replay_reconstructor.js";

export class RecoveryScheduler {
  async scanAndRecover() {
    const deferredJobs = await readDeferredJobs();

    for (const job of deferredJobs) {
      try {
        await replayFromCheckpoint(job);
      } catch (err) {
        console.error("[RECOVERY FAILED]", (job as any).id, err);
      }
    }
  }
}
