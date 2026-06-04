import { readDLQJobs } from "./checkpoint_reader.js";
import { replayFromCheckpoint } from "./replay_reconstructor.js";

export class DLQResolver {
  async scanAndRepair() {
    const dlqJobs = await readDLQJobs();

    for (const job of dlqJobs) {
      // retry with stricter constraints
      try {
        await replayFromCheckpoint(job, {
          strictMode: true
        });
      } catch (err) {
        console.warn("[DLQ UNRECOVERABLE]", (job as any).id);
      }
    }
  }
}
